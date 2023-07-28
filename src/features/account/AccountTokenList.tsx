import Config from '@assets/images/config.svg'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useBalance } from '@utils/Balance'
import { times } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeNavigationProp } from '../home/homeTypes'
import TokenListItem, { TokenSkeleton } from './TokenListItem'

type Props = {
  onLayout?: BottomSheetFlatListProps<PublicKey>['onLayout']
}

const sortValues: Record<string, number> = {
  [HNT_MINT.toBase58()]: 10,
  [IOT_MINT.toBase58()]: 9,
  [MOBILE_MINT.toBase58()]: 8,
  [DC_MINT.toBase58()]: 7,
}
export function getSortValue(mint: string): number {
  return sortValues[mint] || 0
}

const AccountTokenList = ({ onLayout }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { visibleTokens } = useVisibleTokens()

  const onManageTokenList = useCallback(() => {
    navigation.navigate('AccountManageTokenListScreen')
  }, [navigation])
  const { tokenAccounts } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const mints = useMemo(() => {
    return tokenAccounts
      ?.filter(
        (ta) =>
          visibleTokens.has(ta.mint) &&
          ta.balance > 0 &&
          (ta.decimals > 0 || ta.mint === DC_MINT.toBase58()),
      )
      .map((ta) => new PublicKey(ta.mint))
      .sort((a, b) => {
        return getSortValue(b.toBase58()) - getSortValue(a.toBase58())
      })
  }, [tokenAccounts, visibleTokens])

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  // eslint-disable-next-line react/no-unused-prop-types
  const renderItem = useCallback(({ item }: { item: PublicKey }) => {
    return <TokenListItem mint={item} />
  }, [])

  const renderEmptyComponent = useCallback(() => {
    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }, [])

  const renderFooterComponent = useCallback(() => {
    return (
      <TouchableOpacityBox
        onPress={onManageTokenList}
        flexDirection="row"
        justifyContent="center"
        mt="m"
      >
        <Config />
        <Text ml="s" fontWeight="500" color="grey400">
          {t('accountTokenList.manage')}
        </Text>
      </TouchableOpacityBox>
    )
  }, [onManageTokenList, t])

  const keyExtractor = useCallback((mint: PublicKey) => {
    return mint.toBase58()
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
  )

  return (
    <BottomSheetFlatList
      onLayout={onLayout}
      data={mints}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'column',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooterComponent}
      keyExtractor={keyExtractor}
    />
  )
}

export default AccountTokenList
