import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import { useMint } from '@helium/helium-react-hooks'
import { proxiesQuery } from '@helium/voter-stake-registry-hooks'
import { EnhancedProxy } from '@helium/voter-stake-registry-sdk'
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useColors } from '@theme/themeHooks'
import { humanReadable, shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import { times } from 'lodash'
import { FlatList, Image, RefreshControl } from 'react-native'
import { useDebounce } from 'use-debounce'
import { GovernanceWrapper } from './GovernanceWrapper'
import { VoterCardStat } from './VoterCardStat'
import { GovernanceNavigationProp } from './governanceTypes'

const DECENTRALIZATION_RISK_INDEX = 6

export default function VotersScreen() {
  const { t } = useTranslation()
  const { voteService, mint } = useGovernance()
  const { info: mintAcc } = useMint(mint)
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
      voteService: voteService,
    }),
  )
  const proxies = voters?.pages.flat() || []

  const handleOnEndReached = useCallback(() => {
    if (!isLoading && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isLoading, proxySearch])

  const renderEmptyComponent = useCallback(() => {
    if (!proxies) return null

    if (isLoading) {
      return (
        <Box flex={1} flexDirection="column">
          {times(5).map((i) => (
            <VoterSkeleton key={i} />
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
          {t('gov.voters.noneFound')}
        </Text>
      </Box>
    )
  }, [proxies, isLoading, t])

  const renderItem = useCallback(
    ({ item: proxy, index }) => {
      const majority = index < DECENTRALIZATION_RISK_INDEX
      const card = (
        <VoterCard
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
              mt="m"
              p="m"
              mb="m"
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              flexDirection="row"
              alignItems="center"
            >
              <Box>
                <Warning width={24} height={24} />
              </Box>
              <Text variant="body2" color="grey600" px="s">
                {t('gov.voters.warning')}
              </Text>
            </Box>
            {card}
          </>
        )
      }
      if (index === DECENTRALIZATION_RISK_INDEX) {
        return (
          <>
            <Box p="m">
              <Box flexDirection="row" alignItems="center" mb="s">
                <BlueCheck width={24} height={24} />
                <Text ml="m" variant="body2" opacity={0.75}>
                  {t('gov.voters.assignBelow')}
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
    [decimals, t],
  )

  const keyExtractor = useCallback((proxy) => proxy.wallet, [])
  const { primaryText } = useColors()

  return (
    <GovernanceWrapper selectedTab="voters">
      <Text color="white" opacity={0.5} fontSize={20} mb="l">
        {t('gov.voters.title')}
      </Text>
      <SearchInput
        placeholder={t('gov.voters.searchPlaceholder')}
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
            refreshing={isLoading || isFetchingNextPage}
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

const VoterCard: React.FC<{
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
        navigation.navigate('VoterScreen', {
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
              majority ? t('gov.voters.majority') : t('gov.voters.minority')
            }
          />
        </Box>
      </Box>

      <Box px="m" py="s" flexDirection="row" justifyContent="space-between">
        <VoterCardStat
          title="Total Voting Power"
          value={
            proxy.delegatedVeTokens
              ? humanReadable(new BN(proxy.delegatedVeTokens), decimals) || ''
              : '0'
          }
        />
        <VoterCardStat
          title="Proposals Voted"
          value={proxy.numProposalsVoted}
        />
        <VoterCardStat
          title="Last Voted"
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

const VOTER_HEIGHT = 110

export const VoterSkeleton = () => {
  return <CardSkeleton height={VOTER_HEIGHT} />
}

function debounce<T extends unknown[], U>(
  callback: (...args: T) => PromiseLike<U> | U,
  wait: number,
) {
  let timer: any

  return (...args: T): Promise<U> => {
    clearTimeout(timer)
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(callback(...args)), wait)
    })
  }
}
