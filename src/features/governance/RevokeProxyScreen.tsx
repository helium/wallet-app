import BackScreen from '@components/BackScreen'
import { truthy } from '@helium/spl-utils'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useUnassignProxiesMutation } from '@hooks/useGovernanceMutations'
import sleep from '@utils/sleep'
import React, { useCallback, useMemo, useState } from 'react'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { PositionPreview } from './PositionPreview'
import { ProxySearch } from './ProxySearch'
import {
  GovernanceStackParamList,
  GovernanceNavigationProp,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'RevokeProxyScreen'>

export const RevokeProxyScreen = () => {
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
          (!proxyWalletKey || p.proxy.nextVoter.equals(proxyWalletKey!)) &&
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
        className={selected ? 'border-2 border-primary' : undefined}
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
    submit: unassignProxy,
    error,
    isPending: isSubmitting,
  } = useUnassignProxiesMutation()

  const handleSubmit = useCallback(async () => {
    if (proxyWallet && positions) {
      const positionsByKey = positions.reduce(
        (acc, p) => {
          acc[p.pubkey.toString()] = p
          return acc
        },
        {} as Record<string, PositionWithMeta>,
      )
      const selectedPositionKeys = Array.from(selectedPositions)
      const positionMints = selectedPositionKeys
        .map((k) => positionsByKey[k]?.mint.toBase58())
        .filter(Boolean) as string[]

      await unassignProxy(
        { positionMints, proxyKey: proxyWallet },
        {
          header: t('gov.transactions.revokeProxy'),
          message: t('gov.transactions.revokeProxy'),
        },
      )

      await sleep(2000)
      refetch()
      navigation.goBack()
    }
  }, [
    unassignProxy,
    positions,
    proxyWallet,
    selectedPositions,
    navigation,
    refetch,
    t,
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
      <View className="flex-1 flex-col">
        <View className="mb-4">
          <Text className="text-muted-foreground">
            {t('gov.revokeProxy.description')}
          </Text>
        </View>
        {/* If this view is for a singular position, do not show the set proxy wallet */}
        <View className="mb-4">
          <ProxySearch
            disabled={!!position}
            value={proxyWallet || ''}
            onValueChange={setProxyWallet}
          />
        </View>

        <View className="flex-row justify-between">
          <Text size="base" className="text-muted-foreground">
            {t('gov.revokeProxy.revokePositions')}
          </Text>
          <Text
            size="base"
            className="text-muted-foreground"
            onPress={handleSelectAll}
          >
            {selectedAll
              ? t('gov.assignProxy.deSelectAll')
              : t('gov.assignProxy.selectAll')}
          </Text>
        </View>
        <View className="mb-4 flex-1">
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            data={proxiedPositions}
            renderItem={renderPosition}
          />
        </View>
        {error && (
          <View className="flex-row items-center justify-center pt-3">
            <Text className="font-medium text-destructive">
              {error.toString()}
            </Text>
          </View>
        )}
        <Button
          size="lg"
          className="w-full rounded-full"
          onPress={() => void handleSubmit().catch(console.error)}
          disabled={
            isSubmitting || selectedPositions.size === 0 || !proxyWallet
          }
        >
          {isSubmitting ? (
            <Spinner colorClassName="accent-primary-foreground" />
          ) : (
            t('gov.revokeProxy.title')
          )}
        </Button>
      </View>
    </BackScreen>
  )
}

export default RevokeProxyScreen
