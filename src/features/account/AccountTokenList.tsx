import React, { useCallback, useEffect, useMemo } from 'react'
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
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TokenType } from '../../generated/graphql'
import { useBalance } from '../../utils/Balance'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TokenIcon from './TokenIcon'
import { useBreakpoints } from '../../theme/themeHooks'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import useLayoutHeight from '../../utils/useLayoutHeight'

type Token = {
  type: TokenType
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
}

const ITEM_HEIGHT = 78
const AccountTokenList = ({ loading = false }: Props) => {
  const {
    helium: {
      dcBalance,
      mobileBalance,
      networkBalance,
      networkStakedBalance,
      secBalance,
    },
  } = useBalance()
  const navigation = useNavigation<HomeNavigationProp>()
  const [listItemHeight, setListItemHeight] = useLayoutHeight()
  const breakpoints = useBreakpoints()
  const height = useSharedValue(0)
  const { bottom } = useSafeAreaInsets()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

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
        balance: networkBalance as Balance<NetworkTokens>,
        staked: false,
      },
      {
        type: TokenType.Hnt,
        balance: networkStakedBalance as Balance<NetworkTokens>,
        staked: true,
      },
      {
        type: TokenType.Mobile,
        balance: mobileBalance as Balance<MobileTokens>,
        staked: false,
      },
      {
        type: TokenType.Dc,
        balance: dcBalance as Balance<DataCredits>,
        staked: false,
      },
      {
        type: TokenType.Hst,
        balance: secBalance as Balance<SecurityTokens>,
        staked: false,
      },
    ].filter(
      (token) =>
        token?.balance?.integerBalance > 0 ||
        token?.type === TokenType.Mobile ||
        (token?.type === TokenType.Hnt && token?.staked === false),
    )
  }, [
    dcBalance,
    loading,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
  ])

  const handleNavigation = useCallback(
    (token: Token) => () => {
      navigation.navigate('AccountTokenScreen', { tokenType: token.type })
    },
    [navigation],
  )

  const maxVisibleTokens = useMemo(
    () => (breakpoints?.smallPhone ? 2 : 4),
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
            minHeight={ITEM_HEIGHT}
            alignItems="center"
            paddingHorizontal="l"
            paddingVertical="m"
            borderBottomColor="primaryBackground"
            borderBottomWidth={1}
          >
            <TokenIcon tokenType={token.type} />
            <Box flex={1} paddingHorizontal="m">
              <Box flexDirection="row">
                <Text
                  variant="body1"
                  color="primaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {token.balance?.toString(7, { showTicker: false })}
                </Text>
                <Text
                  variant="body1"
                  color="secondaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {` ${token?.balance?.type.ticker}${
                    token.staked ? ' Staked' : ''
                  }`}
                </Text>
              </Box>
              <AccountTokenCurrencyBalance
                variant="subtitle4"
                color="secondaryText"
                tokenType={token.type}
                staked={token.staked}
              />
            </Box>
            <Arrow color="gray400" />
          </TouchableOpacityBox>
        </Animated.View>
      )
    },
    [handleItemLayout, handleNavigation],
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
          height={ITEM_HEIGHT}
          alignItems="center"
          paddingHorizontal="l"
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

  useEffect(() => {
    let nextHeight = 0
    if (loading) {
      nextHeight = ITEM_HEIGHT * maxVisibleTokens + bottomSpace
    } else if (!listItemHeight) {
      nextHeight = ITEM_HEIGHT * tokens.length + bottomSpace
    } else {
      nextHeight =
        listItemHeight * Math.min(tokens.length, maxVisibleTokens) + bottomSpace
    }
    height.value = withTiming(nextHeight, { duration: 700 })
  }, [
    bottomSpace,
    height.value,
    listItemHeight,
    loading,
    maxVisibleTokens,
    tokens.length,
  ])

  const listStyle = useAnimatedStyle(() => {
    return { height: height.value }
  })

  const keyExtractor = useCallback((item: Token) => {
    if (item.staked) {
      return [item.type, 'staked'].join('-')
    }
    return item.type
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
  )

  return (
    <Animated.View style={listStyle}>
      <FlatList
        scrollEnabled={tokens.length > maxVisibleTokens}
        data={tokens}
        contentContainerStyle={contentContainerStyle}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        keyExtractor={keyExtractor}
      />
    </Animated.View>
  )
}

export default AccountTokenList
