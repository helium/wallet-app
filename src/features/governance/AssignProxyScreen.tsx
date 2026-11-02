import { BackScreen } from '@ui/BackScreen'
import { truthy } from '@helium/spl-utils'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import Slider from '@react-native-community/slider'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useAssignProxiesMutation } from '@hooks/useGovernanceMutations'
import sleep from '@utils/sleep'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useTranslation } from 'react-i18next'
import {
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { PositionPreview } from './PositionPreview'
import { ProxySearch } from './ProxySearch'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'AssignProxyScreen'>

export const AssignProxyScreen = () => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const route = useRoute<Route>()
  const { wallet, position, includeProxied } = route.params
  const { t } = useTranslation()
  const [proxyWallet, setProxyWallet] = useState(wallet || '')
  const { loading, positions, refetch } = useGovernance()
  const proxySearchRef = useRef<TextInput>(null)
  const lastInitializedWallet = useRef<string | undefined>(undefined)
  React.useEffect(() => {
    if (wallet && wallet !== lastInitializedWallet.current) {
      setProxyWallet(wallet)
      lastInitializedWallet.current = wallet
    }
  }, [wallet])

  const selectablePositions = useMemo(
    () =>
      positions?.filter(
        (p) =>
          includeProxied ||
          !p.proxy ||
          p.proxy.nextVoter.equals(PublicKey.default),
      ) || [],
    [includeProxied, positions],
  )
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
    new Set<string>([position].filter(truthy)),
  )
  const today = new Date()
  const now = today.getTime()
  const augustFirst = Date.UTC(
    today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear(),
    7,
    1,
  )
  const maxDate = useMemo(
    () =>
      Math.min(
        augustFirst - 1000,
        ...selectablePositions
          .filter(
            (p) =>
              selectedPositions.has(p.pubkey.toBase58()) &&
              p.proxy &&
              // If there's recursive proxying going on, we can only proxy as far out as the first proxy
              p.proxy.index > 0,
          )
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .map((p) => p.proxy.expirationTime.toNumber() * 1000),
      ),
    [augustFirst, selectablePositions, selectedPositions],
  )
  const maxDays = Math.floor((maxDate - now) / (1000 * 60 * 60 * 24))
  const [selectedDays, setSelectedDays] = useState(maxDays)
  const expirationTime = useMemo(
    () =>
      selectedDays === maxDays
        ? Math.floor(maxDate.valueOf() / 1000)
        : Math.floor(
            new Date().valueOf() / 1000 + selectedDays * (24 * 60 * 60),
          ),
    [selectedDays, maxDays, maxDate],
  )

  const handleSelectedDays = (days: number) => {
    setSelectedDays(days > maxDays ? maxDays : days)
  }

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

  const selectedAll = selectablePositions.length === selectedPositions.size

  const handleSelectAll = useCallback(() => {
    if (selectedAll) {
      setSelectedPositions(new Set([]))
    } else {
      setSelectedPositions(
        new Set(selectablePositions.map((p) => p.pubkey.toBase58())),
      )
    }
  }, [selectablePositions, selectedAll])

  const {
    submit: assignProxy,
    error,
    isPending: isSubmitting,
  } = useAssignProxiesMutation()

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
      const finalExpirationTime = Math.min(
        expirationTime,
        Math.floor(maxDate.valueOf() / 1000),
      )

      await assignProxy(
        {
          positionMints,
          proxyKey: proxyWallet,
          expirationTime: finalExpirationTime,
        },
        {
          header: t('gov.transactions.assignProxy'),
          message: t('gov.transactions.assignProxy'),
        },
      )

      await sleep(2000)
      refetch()
      navigation.goBack()
    }
  }, [
    assignProxy,
    expirationTime,
    maxDate,
    positions,
    proxyWallet,
    selectedPositions,
    navigation,
    refetch,
    t,
  ])
  const safeEdges = useMemo(() => ['top', 'bottom'] as Edge[], [])

  const handleBlurSearch = useCallback(() => {
    proxySearchRef.current?.blur()
  }, [])

  if (loading) return null

  return (
    <BackScreen
      edges={safeEdges}
      className="h-full p-2"
      title={t('gov.assignProxy.title')}
    >
      <TouchableWithoutFeedback onPress={handleBlurSearch}>
        <View className="flex-1 flex-col">
          <View className="mb-4">
            <Text className="text-muted-foreground">
              {t('gov.assignProxy.description')}
            </Text>
          </View>

          <View className="mb-4">
            <ProxySearch
              ref={proxySearchRef}
              value={proxyWallet || ''}
              onValueChange={setProxyWallet}
            />
          </View>

          <View className="flex-row justify-between">
            <Text size="base" className="text-muted-foreground">
              {t('gov.assignProxy.assignPositions')}
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
              data={selectablePositions}
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
          <View className="flex-col">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">
                {t('gov.assignProxy.expiryDate')}
              </Text>
              <Text size="xs" className="text-muted-foreground">
                {selectedDays} {t('gov.assignProxy.days')}
              </Text>
            </View>
            <Slider
              value={selectedDays}
              onSlidingComplete={handleSelectedDays}
              minimumValue={1}
              maximumValue={maxDays}
              step={1}
            />
          </View>
          <Button
            size="dashboard"
            className="w-full rounded-full"
            onPress={() => void handleSubmit().catch(console.error)}
            disabled={
              isSubmitting || selectedPositions.size === 0 || !proxyWallet
            }
          >
            {isSubmitting ? (
              <Spinner colorClassName="accent-primary-foreground" />
            ) : (
              t('gov.assignProxy.title')
            )}
          </Button>
        </View>
      </TouchableWithoutFeedback>
    </BackScreen>
  )
}

export default AssignProxyScreen
