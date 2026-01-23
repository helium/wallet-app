import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { truthy } from '@helium/spl-utils'
import {
  PositionWithMeta,
  useUnassignProxies,
} from '@helium/voter-stake-registry-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useSubmitInstructions } from '@hooks/useSubmitInstructions'
import { hashTagParams } from '@utils/transactionUtils'
import sleep from '@utils/sleep'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { PositionPreview } from './PositionPreview'
import { ProxySearch } from './ProxySearch'
import {
  GovernanceStackParamList,
  GovernanceNavigationProp,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'RevokeProxyScreen'>

export const RevokeProxyScreen = () => {
  const { execute: executeGovernanceTx } = useSubmitInstructions()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const route = useRoute<Route>()
  const { wallet, position } = route.params
  const { t } = useTranslation()
  const [proxyWallet, setProxyWallet] = useState(wallet)
  const proxyWalletKey = usePublicKey(proxyWallet)
  const positionKey = usePublicKey(position)
  const { loading, positions, refetch } = useGovernance()

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
    async (
      header: string,
      instructions: TransactionInstruction[],
      positionKeys: string[],
      proxyWalletParam: string,
    ) => {
      const paramsHash = hashTagParams({
        proxyWallet: proxyWalletParam,
        positions: positionKeys.sort().join(','),
      })
      const tag = `revoke-proxy-${paramsHash}`
      await executeGovernanceTx({
        header,
        message: header,
        instructions,
        tag,
      })
      // Give time for indexer
      await sleep(2000)
      refetch()
      navigation.goBack()
    },
    [executeGovernanceTx, navigation, refetch],
  )

  const handleSubmit = useCallback(async () => {
    if (proxyWallet && positions) {
      const positionsByKey = positions.reduce((acc, p) => {
        acc[p.pubkey.toString()] = p
        return acc
      }, {} as Record<string, PositionWithMeta>)
      const selectedPositionKeys = Array.from(selectedPositions)
      await unassignProxies({
        positions: selectedPositionKeys.map((p) => positionsByKey[p]),
        onInstructions: (ixs) =>
          decideAndExecute(
            t('gov.transactions.revokeProxy'),
            ixs,
            selectedPositionKeys,
            proxyWallet,
          ),
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
