import React, { useCallback, useMemo } from 'react'
import Balance, {
  DataCredits,
  MobileTokens,
  NetworkTokens,
  SecurityTokens,
  AnyCurrencyType,
} from '@helium/currency'
import { times } from 'lodash'
import { useNavigation } from '@react-navigation/native'
import Arrow from '@assets/images/listItemRight.svg'
import { FlatList } from 'react-native-gesture-handler'
import { LayoutChangeEvent } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAccountBalances } from '../../utils/Balance'
import { AccountData, TokenType } from '../../generated/graphql'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TokenIcon from './TokenIcon'
import { useBreakpoints, useSpacing } from '../../theme/themeHooks'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import useLayoutHeight from '../../utils/useLayoutHeight'

type Token = {
  type: TokenType
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  accountData: AccountData | null | undefined
  loading?: boolean
}

const AccountTokenList = ({ accountData, loading = false }: Props) => {
  const displayVals = useAccountBalances(accountData)
  const navigation = useNavigation<HomeNavigationProp>()
  const [listItemHeight, setListItemHeight] = useLayoutHeight()
  const breakpoints = useBreakpoints()
  const { xxl: bottomSpace } = useSpacing()

  const tokens = useMemo((): {
    type: TokenType
    balance: Balance<AnyCurrencyType>
    staked: boolean
  }[] => {
    if (loading) {
      return []
    }
    return [
      {
        type: TokenType.Hnt,
        balance: displayVals?.hnt as Balance<NetworkTokens>,
        staked: false,
      },
      {
        type: TokenType.Hnt,
        balance: displayVals?.stakedHnt as Balance<NetworkTokens>,
        staked: true,
      },
      {
        type: TokenType.Mobile,
        balance: displayVals?.mobile as Balance<MobileTokens>,
        staked: false,
      },
      {
        type: TokenType.Dc,
        balance: displayVals?.dc as Balance<DataCredits>,
        staked: false,
      },
      {
        type: TokenType.Hst,
        balance: displayVals?.hst as Balance<SecurityTokens>,
        staked: false,
      },
    ].filter(
      (token) =>
        token?.balance?.integerBalance > 0 ||
        token?.type === TokenType.Mobile ||
        (token?.type === TokenType.Hnt && token?.staked === false),
    )
  }, [displayVals, loading])

  const handleNavigation = useCallback(
    (token: Token) => () => {
      navigation.navigate('AccountTokenScreen', { tokenType: token.type })
    },
    [navigation],
  )

  const maxVisibleTokens = useMemo(
    () => (breakpoints?.smallPhone ? 3 : 4),
    [breakpoints.smallPhone],
  )

  const handleItemLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (listItemHeight !== 0) return

      setListItemHeight(e)
    },
    [listItemHeight, setListItemHeight],
  )

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: {
        type: TokenType
        balance: Balance<AnyCurrencyType>
        staked: boolean
      }
    }) => {
      return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <TouchableOpacityBox
            onLayout={handleItemLayout}
            onPress={handleNavigation(token)}
            flexDirection="row"
            minHeight={78}
            alignItems="center"
            paddingHorizontal="l"
            paddingVertical="m"
            borderBottomColor="primaryBackground"
            borderBottomWidth={1}
          >
            <TokenIcon tokenType={token.type} />
            <Box flex={1} paddingHorizontal="m">
              <Box flexDirection="row">
                <Text variant="body1" color="primaryText">
                  {token.balance?.toString(7, { showTicker: false })}
                </Text>
                <Text variant="body1" color="secondaryText">
                  {` ${token?.balance?.type.ticker}${
                    token.staked ? ' Staked' : ''
                  }`}
                </Text>
              </Box>
              <AccountTokenCurrencyBalance
                variant="subtitle4"
                color="secondaryText"
                accountData={accountData}
                tokenType={token.type}
                staked={token.staked}
              />
            </Box>
            <Arrow color="gray400" />
          </TouchableOpacityBox>
        </Animated.View>
      )
    },
    [accountData, handleItemLayout, handleNavigation],
  )

  const renderFooter = useCallback(() => {
    if (!loading) return null
    return <>{times(maxVisibleTokens).map((i) => renderSkeletonItem(i))}</>
  }, [loading, maxVisibleTokens])

  const renderHeader = useCallback(() => {
    return <Box height={1} backgroundColor="surface" marginBottom="ms" />
  }, [])

  const renderSkeletonItem = (key: number) => {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} key={key}>
        <Box
          flexDirection="row"
          alignItems="center"
          paddingHorizontal="l"
          paddingVertical="l"
          borderBottomColor="primaryBackground"
          borderBottomWidth={1}
        >
          <Box
            width={40}
            height={40}
            borderRadius="round"
            backgroundColor="surface"
          />
          <Box flex={1} paddingHorizontal="m">
            <Box width={120} height={16} backgroundColor="surface" />
            <Box
              width={70}
              height={16}
              marginTop="s"
              backgroundColor="surface"
            />
          </Box>
          <Arrow color="gray400" />
        </Box>
      </Animated.View>
    )
  }

  const maxHeight = useMemo(() => {
    if (loading) {
      return 89 * maxVisibleTokens + bottomSpace
    }

    if (!listItemHeight) {
      return 78 * tokens.length + bottomSpace
    }

    return (
      listItemHeight * Math.min(tokens.length, maxVisibleTokens) + bottomSpace
    )
  }, [bottomSpace, listItemHeight, loading, maxVisibleTokens, tokens.length])

  const keyExtractor = useCallback((item: Token) => {
    if (item.staked) {
      return [item.type, 'staked'].join('-')
    }
    return item.type
  }, [])

  const listStyle = useMemo(() => ({ maxHeight }), [maxHeight])

  return (
    <FlatList
      style={listStyle}
      data={tokens}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      keyExtractor={keyExtractor}
    />
  )
}

export default AccountTokenList
