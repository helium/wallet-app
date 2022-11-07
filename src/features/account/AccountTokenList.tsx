import React, { useCallback, useMemo } from 'react'
import Balance, {
  DataCredits,
  MobileTokens,
  NetworkTokens,
  SecurityTokens,
  AnyCurrencyType,
  SolTokens,
  Ticker,
} from '@helium/currency'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useBalance } from '../../utils/Balance'
import Box from '../../components/Box'
import useCollectables from '../../utils/useCollectables'
import CollectableListItem, { CollectableSkeleton } from './CollectableListItem'
import TokenListItem, { TokenSkeleton } from './TokenListItem'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
  tokenType: SplTokenType
}

export type SplTokenType = 'tokens' | 'collectables'

const AccountTokenList = ({ loading = false, tokenType }: Props) => {
  const {
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
    updating: updatingTokens,
  } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
  } = useCollectables()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const showCollectables = useMemo(
    () => tokenType === 'collectables',
    [tokenType],
  )

  const tokens = useMemo(() => {
    if (loading || showCollectables) {
      return []
    }

    const allTokens = [
      {
        type: 'HNT',
        balance: networkBalance as Balance<NetworkTokens>,
        staked: false,
      },
      {
        type: 'HNT',
        balance: networkStakedBalance as Balance<NetworkTokens>,
        staked: true,
      },
      {
        type: 'MOBILE',
        balance: mobileBalance as Balance<MobileTokens>,
        staked: false,
      },
      {
        type: 'DC',
        balance: dcBalance as Balance<DataCredits>,
        staked: false,
      },
      {
        type: 'HST',
        balance: secBalance as Balance<SecurityTokens>,
        staked: false,
      },
      {
        type: 'SOL',
        balance: solBalance as Balance<SolTokens>,
        staked: false,
      },
    ] as {
      type: Ticker
      balance: Balance<AnyCurrencyType>
      staked: boolean
    }[]
    return allTokens
      .filter(
        (token) =>
          token?.balance?.integerBalance > 0 ||
          token?.type === 'MOBILE' ||
          (token?.type === 'HNT' && token?.staked === false),
      )
      .splice(1)
  }, [
    dcBalance,
    loading,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    showCollectables,
    solBalance,
  ])

  const flatListItems = useMemo(() => {
    const toks = !showCollectables ? tokens : []
    const cols = showCollectables ? Object.keys(collectablesWithMeta) : []

    return [...toks, ...cols]
  }, [collectablesWithMeta, showCollectables, tokens])

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item:
        | {
            type: Ticker
            balance: Balance<AnyCurrencyType>
            staked: boolean
          }
        | string
    }) => {
      if (typeof token === 'string') {
        return (
          <CollectableListItem
            item={token}
            collectables={collectablesWithMeta}
          />
        )
      }

      const currencyType = token as Token
      return (
        <TokenListItem
          ticker={currencyType.type}
          balance={currencyType.balance}
          staked={currencyType.staked}
        />
      )
    },
    [collectablesWithMeta],
  )

  const renderFooter = useCallback(() => {
    if (!(updatingTokens || loading) && !showCollectables) return null
    if (!loadingCollectables && showCollectables) return null

    if (loadingCollectables && showCollectables) {
      return (
        <Box flex={1} flexDirection="row">
          {times(Object.keys(collectables).length).map((i) => (
            <CollectableSkeleton key={i} />
          ))}
        </Box>
      )
    }

    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }, [
    collectables,
    loading,
    loadingCollectables,
    showCollectables,
    updatingTokens,
  ])

  const keyExtractor = useCallback((item: Token | string) => {
    if (typeof item === 'string') {
      return item
    }
    const currencyToken = item as Token

    if (currencyToken.staked) {
      return [currencyToken.type, 'staked'].join('-')
    }
    return currencyToken.type
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
  )

  return (
    <FlatList
      data={flatListItems}
      scrollEnabled={false}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: !showCollectables ? 'column' : 'row',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListFooterComponent={renderFooter}
      keyExtractor={keyExtractor}
    />
  )
}

export default AccountTokenList
