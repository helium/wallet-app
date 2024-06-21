import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { Select } from '@components/Select'
import Text from '@components/Text'
import {
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  populateMissingDraftInfo,
  toVersionedTx,
  truthy,
} from '@helium/spl-utils'
import {
  PositionWithMeta,
  useAssignProxies,
} from '@helium/voter-stake-registry-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import Slider from '@react-native-community/slider'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import sleep from '@utils/sleep'
import { getBasePriorityFee } from '@utils/walletApiV2'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { PositionPreview } from './PositionPreview'
import { ProxySearch } from './ProxySearch'
import { GovernanceStackParamList } from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'AssignProxyScreen'>

export const AssignProxyScreen = () => {
  const route = useRoute<Route>()

  const { wallet, position } = route.params
  const { t } = useTranslation()
  const [proxyWallet, setProxyWallet] = useState(wallet)
  const { positions, refetch } = useGovernance()
  const positionKey = usePublicKey(position)

  const networks = useMemo(() => {
    return [
      { label: 'HNT', value: 'hnt' },
      { label: 'MOBILE', value: 'mobile' },
      { label: 'IOT', value: 'iot' },
    ]
  }, [])
  const [network, setNetwork] = useState('hnt')

  const unproxiedPositions = useMemo(
    () =>
      positions?.filter(
        (p) =>
          !p.proxy ||
          (p.proxy.nextVoter.equals(PublicKey.default) &&
            (!positionKey || p.pubkey.equals(positionKey!))),
      ) || [],
    [positions, positionKey],
  )
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
    new Set<string>([position].filter(truthy)),
  )
  const today = new Date()
  const augustFirst = Date.UTC(
    today.getMonth() > 7 ? today.getFullYear() + 1 : today.getFullYear(),
    7,
    1,
  )
  const maxDate = Math.min(
    augustFirst - 1000,
    ...unproxiedPositions
      .filter((p) => selectedPositions.has(p.pubkey.toBase58()) && p.proxy)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .map((p) => p.proxy.expirationTime.toNumber() * 1000),
  )
  const maxDays = Math.floor(
    (maxDate - today.getTime()) / (1000 * 60 * 60 * 24),
  )
  const [selectedDays, setSelectedDays] = useState(maxDays)
  const expirationTime = useMemo(
    () =>
      selectedDays === maxDays
        ? maxDate.valueOf() / 1000
        : new Date().valueOf() / 1000 + selectedDays * (24 * 60 * 60),
    [selectedDays, maxDays, maxDate],
  )
  useEffect(() => {
    if (selectedDays > maxDays) {
      setSelectedDays(maxDays)
    }
  }, [maxDays, selectedDays])

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
  const selectedAll = unproxiedPositions.length === selectedPositions.size

  const handleSelectAll = useCallback(() => {
    if (selectedAll) {
      setSelectedPositions(new Set([]))
    } else {
      setSelectedPositions(
        new Set(unproxiedPositions.map((p) => p.pubkey.toBase58())),
      )
    }
  }, [unproxiedPositions, selectedAll])

  const {
    mutateAsync: assignProxies,
    error,
    isPending: isSubmitting,
  } = useAssignProxies()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { anchorProvider } = useSolana()
  const navigation = useNavigation()
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
      await assignProxies({
        positions: Array.from(selectedPositions).map((p) => positionsByKey[p]),
        recipient: new PublicKey(proxyWallet),
        expirationTime: new BN(
          Math.min(expirationTime, maxDate.valueOf() / 1000),
        ),
        onInstructions: (ixs) =>
          decideAndExecute(t('gov.transactions.assignProxy'), ixs),
      })
    }
  }, [
    assignProxies,
    decideAndExecute,
    expirationTime,
    maxDate,
    positions,
    proxyWallet,
    selectedPositions,
    t,
  ])
  const safeEdges = useMemo(() => ['top'] as Edge[], [])

  return (
    <BackScreen
      edges={safeEdges}
      height="100%"
      padding="s"
      title={t('gov.assignProxy.title')}
    >
      <Box flex={1} flexDirection="column">
        <Box mb="m">
          <Text variant="body2" color="white" opacity={0.5}>
            {t('gov.assignProxy.description')}
          </Text>
        </Box>
        <Box mb="m">
          <ProxySearch
            value={proxyWallet || ''}
            onValueChange={setProxyWallet}
          />
        </Box>

        {/* Don't show network when position already defined */}
        {position ? null : (
          <Box mb="m">
            <Text variant="body3" color="secondaryText">
              {t('gov.assignProxy.selectNetwork')}
            </Text>
            <Select
              value={network}
              onValueChange={setNetwork}
              options={networks}
            />
          </Box>
        )}
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="body1" color="white" opacity={0.5}>
            {t('gov.assignProxy.assignPositions')}
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
          <FlatList data={unproxiedPositions} renderItem={renderPosition} />
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
        <Box flexDirection="column">
          <Text variant="body1" color="white" opacity={0.5}>
            {t('gov.assignProxy.expiryDate')}
          </Text>
          <Slider
            value={selectedDays}
            onSlidingComplete={setSelectedDays}
            minimumValue={1}
            maximumValue={maxDays}
            step={1}
          />
          <Box flexDirection="row" justifyContent="flex-end">
            <Text variant="body3" color="secondaryText">
              {selectedDays} {t('gov.assignProxy.days')}
            </Text>
          </Box>
        </Box>
        <ButtonPressable
          width="100%"
          fontSize={16}
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.9}
          titleColorDisabled="secondaryText"
          title={isSubmitting ? undefined : t('gov.assignProxy.title')}
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

export default AssignProxyScreen
