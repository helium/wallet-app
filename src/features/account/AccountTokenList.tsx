import React, { useCallback, useMemo } from 'react'
import Balance, { AnyCurrencyType, SolTokens, Ticker } from '@helium/currency'
import { times } from 'lodash'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
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
    solBalance,
    updating: updatingTokens,
    solBalancesLoading,
    tokenAccounts,
  } = useBalance()
  const { bottom } = useSafeAreaInsets()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const tokens = useMemo(() => {
    if (loading) {
      return []
    }

    if (solBalancesLoading) {
      return []
    }

    const allTokens = [
      {
        type: 'HNT',
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.HNT] : undefined,
      },
      {
        type: 'MOBILE',
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.MOBILE] : undefined,
      },
      {
        type: 'IOT',
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.IOT] : undefined,
      },
      {
        type: 'DC',
        staked: false,
        tokenAccount: tokenAccounts ? tokenAccounts[Mints.DC] : undefined,
      },
      {
        type: 'SOL',
        balance: solBalance as Balance<SolTokens>,
        staked: false,
      },
    ] as {
      type: Ticker
      balance?: Balance<AnyCurrencyType> | number
      staked: boolean
      tokenAccount?: string
    }[]

    return allTokens
  }, [loading, solBalance, tokenAccounts, solBalancesLoading])

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
