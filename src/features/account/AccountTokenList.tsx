import React, { useCallback, useMemo } from 'react'
import Balance, { AnyCurrencyType, Ticker } from '@helium/currency'
import { times } from 'lodash'
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
  loading?: boolean
  onLayout?: BottomSheetFlatListProps<Token>['onLayout']
}

const AccountTokenList = ({ loading = false, onLayout }: Props) => {
  const {
    solBalance,
    hntBalance,
    mobileBalance,
    dcBalance,
    iotBalance,
    updating: updatingTokens,
  } = useBalance()
  const { bottom } = useSafeAreaInsets()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const tokens = useMemo(() => {
    return [hntBalance, mobileBalance, iotBalance, dcBalance, solBalance]
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
      ListEmptyComponent={renderFooter}
      keyExtractor={keyExtractor}
      onLayout={onLayout}
    />
  )
}

export default AccountTokenList
