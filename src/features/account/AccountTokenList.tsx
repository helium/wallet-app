import React, { memo, useCallback, useMemo } from 'react'
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
import { useNavigation } from '@react-navigation/native'
import Arrow from '@assets/images/listItemRight.svg'
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  RefreshControl,
  ViewStyle,
} from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import CircleLoader from '../../components/CircleLoader'
import { useBalance } from '../../utils/Balance'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TokenIcon from './TokenIcon'
import { useBreakpoints, useColors } from '../../theme/themeHooks'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import useLayoutHeight from '../../utils/useLayoutHeight'
import useCollectables from '../../utils/useCollectables'
import { Collectable } from '../../types/solana'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
  renderHeader: JSX.Element
  showCollectables: boolean
}

const ITEM_HEIGHT = 78
const AccountTokenList = ({
  loading = false,
  renderHeader,
  showCollectables,
}: Props) => {
  const {
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
  } = useBalance()
  const { primaryText } = useColors()
  const navigation = useNavigation<HomeNavigationProp>()
  const [listItemHeight, setListItemHeight] = useLayoutHeight()
  const breakpoints = useBreakpoints()
  const COLLECTABLE_HEIGHT = Dimensions.get('window').width / 2
  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh: refreshCollectables,
  } = useCollectables()

  const tokens = useMemo(() => {
    if (loading || showCollectables) {
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
    showCollectables,
    solBalance,
  ])

  const flatListItems = useMemo(() => {
    const toks = !showCollectables ? tokens : []
    const cols = showCollectables ? Object.keys(collectablesWithMeta) : []

    return [...toks, ...cols]
  }, [collectablesWithMeta, showCollectables, tokens])

  const { bottom } = useSafeAreaInsets()

  const handleNavigation = useCallback(
    (token: Token) => () => {
      if (token.type === 'SOL') {
        return
      }
      navigation.navigate('AccountTokenScreen', { tokenType: token.type })
    },
    [navigation],
  )

  const handleCollectableNavigation = useCallback(
    (collection: Collectable[]) => () => {
      if (collection.length > 1) {
        navigation.navigate('AccountCollectionScreen', {
          collection,
        })
      } else {
        navigation.navigate('AccountCollectableScreen', {
          collectable: collection[0],
        })
      }
    },
    [navigation],
  )

  const maxVisibleTokens = useMemo(() => {
    if (breakpoints.largePhone) return 4
    if (breakpoints.phone) return 3
    return 2
  }, [breakpoints.largePhone, breakpoints.phone])

  const handleItemLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (listItemHeight !== 0) return

      setListItemHeight(e)
    },
    [listItemHeight, setListItemHeight],
  )

  const renderCollectable = useCallback(
    ({ item }: { item: string }) => {
      if (!showCollectables) return null
      const { json } = collectablesWithMeta[item][0]

      return (
        <Animated.View
          style={{ width: '50%' }}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <TouchableOpacityBox
            onLayout={handleItemLayout}
            marginHorizontal="s"
            marginVertical="s"
            alignItems="center"
            backgroundColor="surface"
            borderRadius="m"
            onPress={handleCollectableNavigation(collectablesWithMeta[item])}
          >
            <Image
              borderRadius={10}
              style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
              source={{
                uri: json?.image,
              }}
            />
            <Box
              backgroundColor="black"
              borderRadius="s"
              padding="s"
              position="absolute"
              bottom={8}
              left={8}
              flexDirection="row"
            >
              <Text
                variant="body2"
                fontWeight="bold"
                color="white"
                marginRight="s"
              >
                {item}
              </Text>
              <Text variant="body2" fontWeight="bold" color="grey600">
                {collectablesWithMeta[item].length}
              </Text>
            </Box>
          </TouchableOpacityBox>
        </Animated.View>
      )
    },
    [
      showCollectables,
      collectablesWithMeta,
      handleItemLayout,
      handleCollectableNavigation,
      COLLECTABLE_HEIGHT,
    ],
  )

  const renderCollectableSkeletonItem = useCallback(
    (key: number) => {
      if (!loadingCollectables) return null
      return (
        <Animated.View
          style={{ width: '50%' }}
          entering={FadeIn}
          exiting={FadeOut}
          key={key}
        >
          <TouchableOpacityBox
            onLayout={handleItemLayout}
            marginHorizontal="s"
            marginVertical="s"
            alignItems="center"
          >
            <Box
              backgroundColor="surface"
              borderRadius="m"
              height={COLLECTABLE_HEIGHT}
              width="100%"
              justifyContent="center"
              alignItems="center"
            >
              <CircleLoader loaderSize={80} />
            </Box>
          </TouchableOpacityBox>
        </Animated.View>
      )
    },
    [COLLECTABLE_HEIGHT, handleItemLayout, loadingCollectables],
  )

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item:
        | {
            type: Ticker
            balance: Balance<AnyCurrencyType>
            staked: boolean
          }
        | string
    }) => {
      if (typeof token === 'string') {
        return renderCollectable({ item: token })
      }

      const currencyType = token as Token

      const disabled = token.type === 'SOL'
      return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <TouchableOpacityBox
            onLayout={handleItemLayout}
            onPress={handleNavigation(currencyType)}
            flexDirection="row"
            minHeight={ITEM_HEIGHT}
            alignItems="center"
            paddingHorizontal="l"
            paddingVertical="m"
            borderBottomColor="primaryBackground"
            borderBottomWidth={1}
            disabled={disabled}
          >
            <TokenIcon ticker={token.type} />
            <Box flex={1} paddingHorizontal="m">
              <Box flexDirection="row">
                <Text
                  variant="body1"
                  color="primaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {currencyType.balance?.toString(7, { showTicker: false })}
                </Text>
                <Text
                  variant="body1"
                  color="secondaryText"
                  maxFontSizeMultiplier={1.3}
                >
                  {` ${currencyType?.balance?.type.ticker}${
                    currencyType.staked ? ' Staked' : ''
                  }`}
                </Text>
              </Box>
              {!disabled && (
                <AccountTokenCurrencyBalance
                  variant="subtitle4"
                  color="secondaryText"
                  ticker={token.type}
                  staked={token.staked}
                />
              )}
            </Box>
            {!disabled && <Arrow />}
          </TouchableOpacityBox>
        </Animated.View>
      )
    },
    [handleItemLayout, handleNavigation, renderCollectable],
  )

  const renderFooter = useCallback(() => {
    if (!loading && !showCollectables) return null
    if (!loadingCollectables && showCollectables) return null

    if (loadingCollectables && showCollectables) {
      return (
        <Box flex={1} flexDirection="row">
          {times(Object.keys(collectables).length).map((i) =>
            renderCollectableSkeletonItem(i),
          )}
        </Box>
      )
    }

    return <>{times(maxVisibleTokens).map((i) => renderSkeletonItem(i))}</>
  }, [
    collectables,
    loading,
    loadingCollectables,
    maxVisibleTokens,
    renderCollectableSkeletonItem,
    showCollectables,
  ])

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
          <Arrow />
        </Box>
      </Animated.View>
    )
  }

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
    () => ({ paddingBottom: bottom }),
    [bottom],
  )

  return (
    <Animated.FlatList
      scrollEnabled
      data={flatListItems}
      numColumns={2}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      columnWrapperStyle={
        { flexDirection: !showCollectables ? 'column' : 'row' } as ViewStyle
      }
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderFooter}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl
          refreshing={loadingCollectables}
          onRefresh={refreshCollectables}
          title=""
          tintColor={primaryText}
        />
      }
    />
  )
}

export default memo(AccountTokenList)
