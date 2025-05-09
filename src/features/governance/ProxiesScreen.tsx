import BlueCheck from '@assets/images/blueCheck.svg'
import MajorityCircle from '@assets/images/majorityCircle.svg'
import MinorityCircle from '@assets/images/minorityCircle.svg'
import Warning from '@assets/images/warning2.svg'
import Box from '@components/Box'
import { CardSkeleton } from '@components/CardSkeleton'
import { Pill } from '@components/Pill'
import SearchInput from '@components/SearchInput'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { proxiesQuery } from '@helium/voter-stake-registry-hooks'
import { EnhancedProxy } from '@helium/voter-stake-registry-sdk'
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useColors } from '@theme/themeHooks'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Image, RefreshControl } from 'react-native'
import { useDebounce } from 'use-debounce'
import { GovernanceNavigationProp } from './governanceTypes'
import { GovernanceWrapper } from './GovernanceWrapper'
import { ProxyCardStat } from './ProxyCardStat'

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
  } = useInfiniteQuery<EnhancedProxy>(
    proxiesQuery({
      search: searchDebounced,
      amountPerPage: 100,
      voteService,
    }),
  )
  const proxies = useMemo(() => voters?.pages.flat() || [], [voters])
  const handleOnEndReached = useCallback(() => {
    if (!isLoading && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isLoading])

  const renderEmptyComponent = useCallback(() => {
    if (!proxies) return null

    if (loading || isLoading) {
      return (
        <Box flex={1} flexDirection="column">
          {times(5).map((i) => (
            <ProxySkeleton key={i} />
          ))}
        </Box>
      )
    }

    return (
      <Box
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        height={VOTER_HEIGHT}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="m"
      >
        <Text variant="body1" color="white">
          {t('gov.proxies.noneFound')}
        </Text>
      </Box>
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
            <Box
              my="m"
              p="m"
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              flexDirection="row"
              alignItems="center"
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              gap={8}
            >
              <Warning width={24} height={24} />
              <Text variant="body2" color="grey600" flex={1}>
                {t('gov.proxies.warning')}
              </Text>
            </Box>
            {card}
          </>
        )
      }
      if (renderBelowIndex > 0 && index === renderBelowIndex) {
        return (
          <>
            <Box p="m">
              <Box flexDirection="row" alignItems="center" mb="s">
                <BlueCheck width={24} height={24} />
                <Text ml="m" variant="body2" opacity={0.75}>
                  {t('gov.proxies.assignBelow')}
                </Text>
              </Box>
              <Box
                borderWidth={1}
                borderColor="dividerGrey"
                width="60%"
                alignSelf="center"
              />
            </Box>
            {card}
          </>
        )
      }
      return card
    },
    [decimals, renderBelowIndex, t],
  )

  const keyExtractor = useCallback((proxy) => proxy.wallet, [])
  const { primaryText } = useColors()

  return (
    <GovernanceWrapper selectedTab="proxies">
      <Text color="white" opacity={0.5} fontSize={20} mb="l">
        {t('gov.proxies.title')}
      </Text>
      <SearchInput
        placeholder={t('gov.proxies.searchPlaceholder')}
        onChangeText={setProxySearch}
        value={proxySearch}
      />
      <FlatList
        keyExtractor={keyExtractor}
        data={proxies}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={loading || isLoading || isFetchingNextPage}
            onRefresh={refetch}
            title=""
            tintColor={primaryText}
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
    <TouchableContainer
      flexDirection="column"
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      mb="m"
      onPress={() => {
        navigation.navigate('ProxyScreen', {
          mint: mint.toBase58(),
          wallet: proxy.wallet,
        })
      }}
    >
      <Box
        flexDirection="row"
        px="m"
        py="s"
        borderBottomWidth={2}
        borderBottomColor="dividerGrey"
      >
        <Image
          source={{ uri: proxy.image }}
          style={{ width: 48, height: 48, borderRadius: 100 }}
        />
        <Box px="m" flexDirection="column" justifyContent="center">
          <Text variant="body1">{proxy.name}</Text>
          <Text variant="body3">{shortenAddress(proxy.wallet)}</Text>
        </Box>
        <Box flex={1} alignItems="flex-end">
          <Pill
            iconProps={{ width: 8, height: 8 }}
            Icon={majority ? MajorityCircle : MinorityCircle}
            color="black"
            textProps={{ variant: 'body3' }}
            text={
              majority ? t('gov.proxies.majority') : t('gov.proxies.minority')
            }
          />
        </Box>
      </Box>

      <Box px="m" py="s" flexDirection="row" justifyContent="space-between">
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
          alignItems="center"
          value={proxy.numProposalsVoted}
        />
        <ProxyCardStat
          title="Last Voted"
          alignItems="flex-end"
          value={
            proxy.lastVotedAt
              ? new Date(proxy.lastVotedAt).toLocaleDateString()
              : 'Never'
          }
        />
      </Box>
    </TouchableContainer>
  )
}
