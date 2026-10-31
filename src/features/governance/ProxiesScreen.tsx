import { CardSkeleton } from '@ui/CardSkeleton'
import { Pill } from '@ui/Pill'
import { SearchInput } from '@ui/SearchInput'
import { proxiesQuery } from '@helium/voter-stake-registry-hooks'
import { EnhancedProxy } from '@helium/voter-stake-registry-sdk'
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import { times } from 'lodash'
import { Circle, CircleCheck, TriangleAlert } from 'lucide-react-native'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Image, RefreshControl, View } from 'react-native'
import { useCSSVariable, withUniwind } from 'uniwind'
import { useDebounce } from 'use-debounce'
import { GovernanceNavigationProp } from './governanceTypes'
import { GovernanceWrapper } from './GovernanceWrapper'
import { ProxyCardStat } from './ProxyCardStat'

const WarningIcon = withUniwind(TriangleAlert)
const CheckIcon = withUniwind(CircleCheck)

const DECENTRALIZATION_RISK_PERCENT = 10
const VOTER_HEIGHT = 110

export const ProxySkeleton = () => {
  return <CardSkeleton height={VOTER_HEIGHT} />
}

export default function ProxiesScreen() {
  const { t } = useTranslation()
  const { loading, voteService, mintAcc } = useGovernance()
  const decimals = mintAcc?.decimals
  const [proxySearch, setProxySearch] = useState('')
  const [searchDebounced] = useDebounce(proxySearch, 300)
  const {
    data: voters,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery(
    proxiesQuery({
      search: searchDebounced,
      amountPerPage: 100,
      voteService,
    }),
  )
  const proxies = useMemo(() => voters?.pages.flat() || [], [voters])
  const handleOnEndReached = useCallback(() => {
    if (!isLoading && hasNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isLoading])

  const renderEmptyComponent = useCallback(() => {
    if (!proxies) return null

    if (loading || isLoading) {
      return (
        <View className="flex-1 flex-col">
          {times(5).map((i) => (
            <ProxySkeleton key={i} />
          ))}
        </View>
      )
    }

    return (
      <View
        className="mb-4 w-full items-center justify-center rounded-[12px] bg-secondary"
        style={{ height: VOTER_HEIGHT }}
      >
        <Text size="base">{t('gov.proxies.noneFound')}</Text>
      </View>
    )
  }, [proxies, isLoading, loading, t])

  const renderBelowIndex = useMemo(() => {
    return proxies.findIndex(
      (proxy) => Number(proxy.percent) < DECENTRALIZATION_RISK_PERCENT,
    )
  }, [proxies])

  const renderItem = useCallback(
    ({ item: proxy, index }) => {
      const majority = Number(proxy.percent) >= DECENTRALIZATION_RISK_PERCENT
      const card = (
        <ProxyCard
          decimals={decimals}
          key={proxy.wallet}
          proxy={proxy}
          majority={majority}
        />
      )
      if (index === 0) {
        return (
          <>
            <View className="my-4 flex-row items-center gap-2 rounded-[12px] bg-secondary p-4">
              <WarningIcon size={24} colorClassName="accent-warning-500" />
              <Text className="flex-1 text-muted-foreground">
                {t('gov.proxies.warning')}
              </Text>
            </View>
            {card}
          </>
        )
      }
      if (renderBelowIndex > 0 && index === renderBelowIndex) {
        return (
          <>
            <View className="p-4">
              <View className="mb-2 flex-row items-center">
                <CheckIcon size={24} colorClassName="accent-blue-dark-500" />
                <Text className="ml-4 text-muted-foreground">
                  {t('gov.proxies.assignBelow')}
                </Text>
              </View>
              <View className="w-3/5 self-center border border-border" />
            </View>
            {card}
          </>
        )
      }
      return card
    },
    [decimals, renderBelowIndex, t],
  )

  const keyExtractor = useCallback((proxy) => proxy.wallet, [])
  const foreground = useCSSVariable('--color-foreground')

  return (
    <GovernanceWrapper selectedTab="proxies">
      <Text size="xl" className="mb-6 text-muted-foreground">
        {t('gov.proxies.title')}
      </Text>
      <SearchInput
        placeholder={t('gov.proxies.searchPlaceholder')}
        onChangeText={setProxySearch}
        value={proxySearch}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={keyExtractor}
        data={proxies}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={loading || isLoading || isFetchingNextPage}
            onRefresh={() => void refetch().catch(console.error)}
            title=""
            tintColor={typeof foreground === 'string' ? foreground : undefined}
          />
        }
        onEndReached={handleOnEndReached}
      />
    </GovernanceWrapper>
  )
}

const ProxyCard: React.FC<{
  proxy: EnhancedProxy
  majority: boolean
  decimals?: number
}> = ({ proxy, majority, decimals }) => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const { t } = useTranslation()
  const { mint } = useGovernance()
  return (
    <PressableScale
      className="mb-4 flex-col rounded-[12px] bg-secondary"
      onPress={() => {
        navigation.navigate(
          'ProxyScreen',
          { mint: mint.toBase58(), wallet: proxy.wallet },
          { pop: true },
        )
      }}
    >
      <View className="flex-row border-b-2 border-border px-4 py-2">
        <Image source={{ uri: proxy.image }} className="size-12 rounded-full" />
        <View className="flex-col justify-center px-4">
          <Text size="base">{proxy.name}</Text>
          <Text size="xs" className="text-muted-foreground">
            {shortenAddress(proxy.wallet)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Pill
            iconSize={8}
            Icon={Circle}
            iconColorClassName={
              majority ? 'accent-warning-500' : 'accent-blue-dark-500'
            }
            color="primary"
            textSize="xs"
            text={
              majority ? t('gov.proxies.majority') : t('gov.proxies.minority')
            }
          />
        </View>
      </View>

      <View className="flex-row justify-between px-4 py-2">
        <ProxyCardStat
          title="Total Voting Power"
          value={
            // Force 2 decimals
            decimals && proxy.proxiedVeTokens
              ? humanReadable(
                  new BN(proxy.proxiedVeTokens).div(
                    new BN(10 ** (decimals - 2)),
                  ),
                  2,
                ) || ''
              : ''
          }
        />
        <ProxyCardStat
          title="Proposals Voted"
          className="items-center"
          value={proxy.numProposalsVoted}
        />
        <ProxyCardStat
          title="Last Voted"
          className="items-end"
          value={
            proxy.lastVotedAt
              ? new Date(proxy.lastVotedAt).toLocaleDateString()
              : 'Never'
          }
        />
      </View>
    </PressableScale>
  )
}
