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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useBalance } from '@utils/Balance'
import { Mints } from '@utils/constants'
import TokenListItem, { TokenSkeleton } from './TokenListItem'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
  onLayout?: BottomSheetFlatListProps<Token>['onLayout']
}

const AccountTokenList = ({ loading = false, onLayout }: Props) => {
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
    solBalancesLoading,
    tokenAccounts,
  } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const { l1Network } = useAppStorage()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const tokens = useMemo(() => {
    if (loading) {
      return []
    }

    if (l1Network === 'solana' && solBalancesLoading) {
      return []
    }

    const allTokens = [
      {
        type: 'HNT',
        balance: networkBalance as Balance<NetworkTokens>,
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.HNT] : undefined,
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
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.MOBILE] : undefined,
      },
      {
        type: 'IOT',
        balance:
          l1Network === 'solana'
            ? iotSolBalance
            : (iotBalance as Balance<IotTokens>),
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.IOT] : undefined,
      },
      {
        type: 'DC',
        balance: dcBalance as Balance<DataCredits>,
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.DC] : undefined,
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
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.SOL] : undefined,
      },
    ] as {
      type: Ticker
      balance: Balance<AnyCurrencyType> | number
      staked: boolean
      tokenAccount?: string
    }[]

    return allTokens.filter(
      (token) =>
        (typeof token !== 'number' &&
          (token?.balance as Balance<AnyCurrencyType>).integerBalance > 0) ||
        token?.type === 'MOBILE' ||
        (token?.type === 'IOT' && l1Network === 'solana') ||
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
    tokenAccounts,
    solBalancesLoading,
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
        tokenAccount?: string
      }
    }) => {
      return (
        <TokenListItem
          ticker={token.type}
          balance={token.balance}
          staked={token.staked}
          tokenAccount={token.tokenAccount}
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data={tokens as any}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'column',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderFooter}
      keyExtractor={keyExtractor}
      onLayout={onLayout}
    />
  )
}

export default AccountTokenList
