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
import TokenListItem, { TokenSkeleton } from './TokenListItem'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
}

const AccountTokenList = ({ loading = false }: Props) => {
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

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const tokens = useMemo(() => {
    if (loading) {
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
    return allTokens.filter(
      (token) =>
        token?.balance?.integerBalance > 0 ||
        token?.type === 'MOBILE' ||
        (token?.type === 'HNT' && token?.staked === false),
    )
  }, [
    dcBalance,
    loading,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
  ])

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: {
        type: Ticker
        balance: Balance<AnyCurrencyType>
        staked: boolean
      }
    }) => {
      return (
        <TokenListItem
          ticker={token.type}
          balance={token.balance}
          staked={token.staked}
        />
      )
    },
    [],
  )

  const renderFooter = useCallback(() => {
    if (!(updatingTokens || loading)) return null

    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }, [loading, updatingTokens])

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
      data={tokens}
      scrollEnabled={false}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'column',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderFooter}
      keyExtractor={keyExtractor}
    />
  )
}

export default AccountTokenList
