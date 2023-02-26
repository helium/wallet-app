import React, { useCallback, useMemo } from 'react'
import Balance, {
  DataCredits,
  MobileTokens,
  NetworkTokens,
  SecurityTokens,
  AnyCurrencyType,
  SolTokens,
  Ticker,
  IotTokens,
} from '@helium/currency'
import { times } from 'lodash'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useBalance } from '../../utils/Balance'
import TokenListItem, { TokenSkeleton } from './TokenListItem'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
  refreshing: boolean
  onRefresh?: () => void
  onLayout?: BottomSheetFlatListProps<Token>['onLayout']
}

const AccountTokenList = ({
  loading = false,
  refreshing,
  onRefresh,
  onLayout,
}: Props) => {
  const {
    dcBalance,
    mobileBalance,
    mobileSolBalance,
    iotBalance,
    iotSolBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
    updating: updatingTokens,
  } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const { l1Network } = useAppStorage()

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
        balance:
          l1Network === 'solana'
            ? mobileSolBalance
            : (mobileBalance as Balance<MobileTokens>),
        staked: false,
      },
      {
        type: 'IOT',
        balance:
          l1Network === 'solana'
            ? iotSolBalance
            : (iotBalance as Balance<IotTokens>),
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
    l1Network,
    dcBalance,
    iotBalance,
    iotSolBalance,
    loading,
    mobileBalance,
    mobileSolBalance,
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
    <BottomSheetFlatList
      data={tokens}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'column',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderFooter}
      keyExtractor={keyExtractor}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onLayout={onLayout}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="white"
        />
      }
    />
  )
}

export default AccountTokenList
