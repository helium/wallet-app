import React, { useCallback, useMemo } from 'react'
import { times } from 'lodash'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useTranslation } from 'react-i18next'
import Config from '@assets/images/config.svg'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useBalance } from '../../utils/Balance'
import Text from '../../components/Text'
import TokenListItem, { TokenSkeleton } from './TokenListItem'
import { Token, useTokenList } from '../../hooks/useTokensList'

type Props = {
  loading?: boolean
  refreshing: boolean
  onRefresh?: () => void
  onLayout?: BottomSheetFlatListProps<Token>['onLayout']
  onManageTokenList: () => void
}

const AccountTokenList: React.FC<Props> = ({
  loading = false,
  refreshing,
  onRefresh,
  onLayout,
  onManageTokenList,
}) => {
  const { updating: updatingTokens } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { tokens } = useTokenList()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const filteredTokens = useMemo(() => {
    if (updatingTokens || loading) return []

    return tokens.filter((token) => token.canShow)
  }, [loading, tokens, updatingTokens])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: token }: { index: number; item: Token }) => {
      return (
        <TokenListItem
          ticker={token.type}
          balance={token.balance}
          staked={token.staked}
          withoutBorderBottom={index === tokens.length - 1}
        />
      )
    },
    [tokens.length],
  )

  const renderFooter = useMemo(() => {
    if (!(updatingTokens || loading))
      return (
        <TouchableOpacityBox
          onPress={() => onManageTokenList()}
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

    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }, [loading, onManageTokenList, t, updatingTokens])

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
      data={filteredTokens}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'column',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListFooterComponent={renderFooter}
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
