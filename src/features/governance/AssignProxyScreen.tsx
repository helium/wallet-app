import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { truthy } from '@helium/spl-utils'
import {
  PositionWithMeta,
  useAssignProxies,
} from '@helium/voter-stake-registry-hooks'
import Slider from '@react-native-community/slider'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useSubmitInstructions } from '@hooks/useSubmitInstructions'
import { hashTagParams } from '@utils/transactionUtils'
import sleep from '@utils/sleep'
import BN from 'bn.js'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, TextInput, TouchableWithoutFeedback } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { PositionPreview } from './PositionPreview'
import { ProxySearch } from './ProxySearch'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'AssignProxyScreen'>

export const AssignProxyScreen = () => {
  const { execute: executeGovernanceTx } = useSubmitInstructions()
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

  const handleSelectedDays = (days: number) => {
    setSelectedDays(days > maxDays ? maxDays : days)
  }

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
    mutateAsync: assignProxies,
    error,
    isPending: isSubmitting,
  } = useAssignProxies()

  const decideAndExecute = useCallback(
    async (
      header: string,
      instructions: TransactionInstruction[],
      positionKeys: string[],
      proxyWalletParam: string,
      expirationTimeParam: number,
    ) => {
      const paramsHash = hashTagParams({
        proxyWallet: proxyWalletParam,
        expirationTime: expirationTimeParam,
        positions: positionKeys.sort().join(','),
      })
      const tag = `assign-proxy-${paramsHash}`
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
      const finalExpirationTime = Math.min(
        expirationTime,
        maxDate.valueOf() / 1000,
      )
      await assignProxies({
        positions: selectedPositionKeys.map((p) => positionsByKey[p]),
        recipient: new PublicKey(proxyWallet),
        expirationTime: new BN(finalExpirationTime),
        onInstructions: (ixs) =>
          decideAndExecute(
            t('gov.transactions.assignProxy'),
            ixs,
            selectedPositionKeys,
            proxyWallet,
            finalExpirationTime,
          ),
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

  const handleBlurSearch = useCallback(() => {
    proxySearchRef.current?.blur()
  }, [])

  if (loading) return null

  return (
    <BackScreen
      edges={safeEdges}
      height="100%"
      padding="s"
      title={t('gov.assignProxy.title')}
    >
      <TouchableWithoutFeedback onPress={handleBlurSearch}>
        <Box flex={1} flexDirection="column">
          <Box mb="m">
            <Text variant="body2" color="white" opacity={0.5}>
              {t('gov.assignProxy.description')}
            </Text>
          </Box>

          <Box mb="m">
            <ProxySearch
              ref={proxySearchRef}
              value={proxyWallet || ''}
              onValueChange={setProxyWallet}
            />
          </Box>

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
            <FlatList data={selectablePositions} renderItem={renderPosition} />
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
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text variant="body2" color="white" opacity={0.5}>
                {t('gov.assignProxy.expiryDate')}
              </Text>
              <Text variant="body3" color="secondaryText">
                {selectedDays} {t('gov.assignProxy.days')}
              </Text>
            </Box>
            <Slider
              value={selectedDays}
              onSlidingComplete={handleSelectedDays}
              minimumValue={1}
              maximumValue={maxDays}
              step={1}
            />
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
      </TouchableWithoutFeedback>
    </BackScreen>
  )
}

export default AssignProxyScreen
