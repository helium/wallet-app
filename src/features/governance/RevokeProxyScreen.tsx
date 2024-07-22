import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { Select } from '@components/Select'
import Text from '@components/Text'
import {
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  populateMissingDraftInfo,
  toVersionedTx,
  truthy,
} from '@helium/spl-utils'
import {
  PositionWithMeta,
  useUnassignProxies,
} from '@helium/voter-stake-registry-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import sleep from '@utils/sleep'
import { getBasePriorityFee } from '@utils/walletApiV2'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { PositionPreview } from './PositionPreview'
import { ProxySearch } from './ProxySearch'
import {
  GovernanceStackParamList,
  GovernanceNavigationProp,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'RevokeProxyScreen'>

export const RevokeProxyScreen = () => {
  const { walletSignBottomSheetRef } = useWalletSign()
  const { anchorProvider } = useSolana()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const route = useRoute<Route>()
  const { wallet, position } = route.params
  const { t } = useTranslation()
  const [proxyWallet, setProxyWallet] = useState(wallet)
  const proxyWalletKey = usePublicKey(proxyWallet)
  const positionKey = usePublicKey(position)
  const { loading, positions, refetch, mint } = useGovernance()
  const networks = useMemo(() => {
    return [
      { label: 'HNT', value: HNT_MINT.toBase58() },
      { label: 'MOBILE', value: MOBILE_MINT.toBase58() },
      { label: 'IOT', value: IOT_MINT.toBase58() },
    ]
  }, [])

  const proxiedPositions = useMemo(
    () =>
      positions?.filter(
        (p) =>
          p.proxy &&
          !p.proxy.nextVoter.equals(PublicKey.default) &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (!proxyWalletKey || p.proxy.nextVoter.equals(proxyWalletKey!)) &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (!positionKey || p.pubkey.equals(positionKey!)),
      ),
    [positions, proxyWalletKey, positionKey],
  )
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
    new Set<string>([position].filter(truthy)),
  )

  const renderPosition = ({ item }: { item: PositionWithMeta }) => {
    const selected = selectedPositions.has(item.pubkey.toBase58())
    return (
      <PositionPreview
        borderWidth={selected ? 2 : 0}
        borderColor={selected ? 'blue500' : undefined}
        position={item}
        onPress={() => {
          setSelectedPositions((sel) => {
            const key = item.pubkey.toBase58()
            const newS = new Set(sel)
            if (sel.has(key)) {
              newS.delete(key)
              return newS
            }
            newS.add(key)
            return newS
          })
        }}
      />
    )
  }
  const selectedAll = proxiedPositions?.length === selectedPositions.size

  const handleSelectAll = useCallback(() => {
    if (selectedAll) {
      setSelectedPositions(new Set([]))
    } else {
      setSelectedPositions(
        new Set(proxiedPositions?.map((p) => p.pubkey.toBase58())),
      )
    }
  }, [proxiedPositions, selectedAll])

  const {
    mutateAsync: unassignProxies,
    error,
    isPending: isSubmitting,
  } = useUnassignProxies()

  const decideAndExecute = useCallback(
    async (header: string, instructions: TransactionInstruction[]) => {
      if (!anchorProvider || !walletSignBottomSheetRef) return

      const transactions = await batchInstructionsToTxsWithPriorityFee(
        anchorProvider,
        instructions,
        {
          basePriorityFee: await getBasePriorityFee(),
        },
      )
      const populatedTxs = await Promise.all(
        transactions.map((tx) =>
          populateMissingDraftInfo(anchorProvider.connection, tx),
        ),
      )
      const txs = populatedTxs.map((tx) => toVersionedTx(tx))

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header,
        serializedTxs: txs.map((transaction) =>
          Buffer.from(transaction.serialize()),
        ),
      })

      if (decision) {
        await bulkSendTransactions(
          anchorProvider,
          transactions,
          undefined,
          10,
          [],
          MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
        )
        // Give time for indexer
        await sleep(2000)
        refetch()
        navigation.goBack()
      } else {
        throw new Error('User rejected transaction')
      }
    },
    [anchorProvider, navigation, refetch, walletSignBottomSheetRef],
  )

  const handleSubmit = useCallback(async () => {
    if (proxyWallet && positions) {
      const positionsByKey = positions.reduce((acc, p) => {
        acc[p.pubkey.toString()] = p
        return acc
      }, {} as Record<string, PositionWithMeta>)
      await unassignProxies({
        positions: Array.from(selectedPositions).map((p) => positionsByKey[p]),
        onInstructions: (ixs) =>
          decideAndExecute(t('gov.transactions.revokeProxy'), ixs),
      })
    }
  }, [
    decideAndExecute,
    positions,
    proxyWallet,
    selectedPositions,
    t,
    unassignProxies,
  ])
  const safeEdges = useMemo(() => ['top'] as Edge[], [])

  if (loading) return null

  return (
    <BackScreen
      edges={safeEdges}
      height="100%"
      padding="s"
      title={t('gov.revokeProxy.title')}
    >
      <Box flex={1} flexDirection="column">
        <Box mb="m">
          <Text variant="body2" color="white" opacity={0.5}>
            {t('gov.revokeProxy.description')}
          </Text>
        </Box>
        {/* If this view is for a singular position, do not show the set proxy wallet */}
        <Box mb="m">
          <ProxySearch
            disabled={!!position}
            value={proxyWallet || ''}
            onValueChange={setProxyWallet}
          />
        </Box>

        {/* Don't show network when position already defined */}
        {position ? null : (
          <Box mb="m">
            <Text variant="body3" color="secondaryText" mb="xs">
              {t('gov.assignProxy.selectNetwork')}
            </Text>
            <Select
              value={mint.toBase58()}
              onValueChange={(m: string) => navigation.setParams({ mint: m })}
              options={networks}
            />
          </Box>
        )}
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="body1" color="white" opacity={0.5}>
            {t('gov.revokeProxy.revokePositions')}
          </Text>
          <Text
            variant="body1"
            color="white"
            opacity={0.5}
            onPress={handleSelectAll}
          >
            {selectedAll
              ? t('gov.assignProxy.deSelectAll')
              : t('gov.assignProxy.selectAll')}
          </Text>
        </Box>
        <Box flex={1} mb="m">
          <FlatList data={proxiedPositions} renderItem={renderPosition} />
        </Box>
        {error && (
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            paddingTop="ms"
          >
            <Text variant="body3Medium" color="red500">
              {error.toString()}
            </Text>
          </Box>
        )}
        <ButtonPressable
          width="100%"
          fontSize={16}
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.9}
          titleColorDisabled="secondaryText"
          title={isSubmitting ? undefined : t('gov.revokeProxy.title')}
          titleColor="black"
          onPress={handleSubmit}
          disabled={
            isSubmitting || selectedPositions.size === 0 || !proxyWallet
          }
          TrailingComponent={
            isSubmitting ? <CircleLoader color="white" /> : undefined
          }
        />
      </Box>
    </BackScreen>
  )
}

export default RevokeProxyScreen
