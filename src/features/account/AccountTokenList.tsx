import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { FlatList } from 'react-native-gesture-handler'
import { Image, LayoutChangeEvent, RefreshControl } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useBalance } from '../../utils/Balance'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TokenIcon from './TokenIcon'
import {
  useBorderRadii,
  useBreakpoints,
  useColors,
} from '../../theme/themeHooks'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import useLayoutHeight from '../../utils/useLayoutHeight'
import TabBar from '../../components/TabBar'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { Collectable } from '../../types/solana'
import useCollectables from '../../utils/useCollectables'
import { ww } from '../../utils/layout'
import CircleLoader from '../../components/CircleLoader'

type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  loading?: boolean
}

const ITEM_HEIGHT = 78
const COLLECTABLE_HEIGHT = ww / 2
type SplTokenType = 'tokens' | 'collectables'

const AccountTokenList = ({ loading = false }: Props) => {
  const {
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
    updateVars: refreshTokens,
    updating: updatingTokens,
  } = useBalance()
  const navigation = useNavigation<HomeNavigationProp>()
  const [listItemHeight, setListItemHeight] = useLayoutHeight()
  const breakpoints = useBreakpoints()
  const { l1Network } = useAppStorage()
  const { currentAccount } = useAccountStorage()
  const height = useSharedValue(0)
  const { bottom } = useSafeAreaInsets()
  const [tokenType, setTokenType] = useState<SplTokenType>('tokens')
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const { lm } = useBorderRadii()
  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh: refreshCollectables,
  } = useCollectables()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const showCollectables = useMemo(
    () => tokenType === 'collectables',
    [tokenType],
  )

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

  const tabData = useMemo((): Array<{
    value: SplTokenType
    title: string
  }> => {
    return [
      { value: 'tokens', title: t('accountTokenList.tokens') },
      { value: 'collectables', title: t('accountTokenList.collectables') },
    ]
  }, [t])

  const handleItemSelected = useCallback((type: string) => {
    setTokenType(type as SplTokenType)
  }, [])

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
              borderRadius={lm}
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
      lm,
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
    [handleItemLayout, loadingCollectables],
  )

  const renderHeader = useCallback(() => {
    if (l1Network === 'solana' && currentAccount) {
      return (
        <TabBar
          backgroundColor="black"
          tabBarOptions={tabData}
          selectedValue={tokenType}
          onItemSelected={handleItemSelected}
          stretchItems
          marginBottom="ms"
        />
      )
    }

    return <Box height={1} backgroundColor="surface" marginBottom="ms" />
  }, [currentAccount, handleItemSelected, l1Network, tabData, tokenType])

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

  useEffect(() => {
    let nextHeight = 0
    if (tokenType === 'collectables') return

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
    tokenType,
    tokens.length,
  ])

  const listStyle = useAnimatedStyle(() => {
    return { height: height.value }
  })

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
    <Animated.View style={listStyle}>
      <FlatList
        data={flatListItems}
        numColumns={2}
        stickyHeaderIndices={[0]}
        columnWrapperStyle={{
          flexDirection: !showCollectables ? 'column' : 'row',
        }}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={showCollectables ? loadingCollectables : updatingTokens}
            onRefresh={showCollectables ? refreshCollectables : refreshTokens}
            title=""
            tintColor={primaryText}
          />
        }
      />
    </Animated.View>
  )
}

export default AccountTokenList
