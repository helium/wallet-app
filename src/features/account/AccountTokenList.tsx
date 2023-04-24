import React, { useCallback, useMemo } from 'react'
import Balance, { AnyCurrencyType, Ticker } from '@helium/currency'
import { times, without } from 'lodash'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useBalance } from '@utils/Balance'
import TokenListItem, { TokenSkeleton } from './TokenListItem'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  onLayout?: BottomSheetFlatListProps<Token>['onLayout']
}

const AccountTokenList = ({ onLayout }: Props) => {
  const { solBalance, hntBalance, mobileBalance, dcBalance, iotBalance } =
    useBalance()
  const { bottom } = useSafeAreaInsets()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const tokens = useMemo(() => {
    const allTokens = [
      hntBalance,
      mobileBalance,
      iotBalance,
      dcBalance,
      solBalance,
    ]
    return without(allTokens, undefined) as Balance<AnyCurrencyType>[]
  }, [dcBalance, hntBalance, iotBalance, mobileBalance, solBalance])

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: Balance<AnyCurrencyType>
    }) => {
      return <TokenListItem balance={token} />
    },
    [],
  )

  const renderEmptyComponent = useCallback(() => {
    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }, [])

  const keyExtractor = useCallback((item: Balance<AnyCurrencyType>) => {
    return item.type.ticker
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
      ListEmptyComponent={renderEmptyComponent}
      keyExtractor={keyExtractor}
      onLayout={onLayout}
    />
  )
}

export default AccountTokenList
