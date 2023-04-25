import React, { FC, useCallback, useMemo } from 'react'
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs'
import {
  Edge,
  useSafeAreaInsets,
  initialWindowMetrics,
} from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { RouteProp } from '@react-navigation/native'
import { SvgProps } from 'react-native-svg'
import { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import Hotspot from '@assets/images/hotspot.svg'
import NFT from '@assets/images/nft.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import SafeAreaBox from '@components/SafeAreaBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import Text from '@components/Text'
import Box from '@components/Box'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { Font } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import NftsNavigator from './NFTsNavigator'
import HotspotsNavigator from './HotspotsNavigator'
import { appSlice } from '../../store/slices/appSlice'
import { useAppDispatch } from '../../store/store'
import { RootState } from '../../store/rootReducer'

const Tab = createMaterialTopTabNavigator()

const MATERIAL_TAB_HEIGHT = 56

export type CollectablesTabParamList = {
  Hotspots: undefined
  NFTs: undefined
}

function CollectablesTabNavigator() {
  const { top } = useSafeAreaInsets()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const { t } = useTranslation()
  const colors = useColors()
  const dispatch = useAppDispatch()
  const [headerHeight, setHeaderHeight] = useLayoutHeight()

  const showCollectablesTabBar = useSelector(
    (state: RootState) => state.app.showCollectablesTabBar,
  )

  const realTop = useMemo(
    () =>
      top === 0 && initialWindowMetrics?.insets
        ? initialWindowMetrics?.insets.top
        : top,
    [top],
  )

  const animatedStyles = useAnimatedStyle(() => {
    return {
      flex: 1,
      marginTop: withSpring(
        showCollectablesTabBar
          ? 0
          : -(headerHeight + MATERIAL_TAB_HEIGHT + realTop * 2),
        {
          damping: 100,
          mass: 0.5,
          stiffness: 100,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 2,
        },
      ),
    }
  }, [showCollectablesTabBar])

  const screenOpts = useCallback(
    ({ route }: { route: RouteProp<CollectablesTabParamList> }) =>
      ({
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: Font.medium,
          fontSize: 20,
          textTransform: 'none',
        },
        tabBarShowIcon: true,
        tabBarStyle: {
          backgroundColor: colors.primaryBackground,
          width: '100%',
        },
        tabBarContentContainerStyle: {
          borderBottomColor: colors.secondaryText,
          borderBottomWidth: 1,
          justifyContent: 'center',
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primaryText,
          height: 3,
          position: undefined,
        },
        tabBarIndicatorContainerStyle: {
          // TODO: Fix this hacky solution
          left: '-13%',
          justifyContent: 'flex-end',
          alignItems: 'center',
        },
        tabBarItemStyle: {
          flexDirection: 'row',
          width: 'auto',
        },
        tabBarIcon: ({ focused }) => {
          const color = focused ? colors.primaryText : colors.secondaryText
          let Icon: FC<SvgProps> | null = null
          switch (route.name) {
            case 'Hotspots':
              Icon = Hotspot
              break
            case 'NFTs':
              Icon = NFT
              break
          }
          if (!Icon) return null

          return (
            <Box height="100%" justifyContent="center" alignItems="center">
              <Icon color={color} />
            </Box>
          )
        },
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.secondaryText,
        title: t(`collectablesScreen.${route.name.toLowerCase()}.title`),
      } as MaterialTopTabNavigationOptions),

    [colors.primaryBackground, colors.primaryText, colors.secondaryText, t],
  )

  const tabLsnr = useCallback(
    ({ route }) => ({
      state: () => {
        if (!route.state || route.state.index === 0) {
          dispatch(appSlice.actions.setCollectablesTabBar(true))
        } else {
          dispatch(appSlice.actions.setCollectablesTabBar(false))
        }
      },
    }),
    [dispatch],
  )

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <Text
          marginTop="m"
          marginBottom="l"
          alignSelf="center"
          variant="h4"
          onLayout={setHeaderHeight}
        >
          {t('collectablesScreen.title')}
        </Text>
        <ReAnimatedBox style={animatedStyles}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore This warning is a bug with @react-navigation */}
          <Tab.Navigator screenOptions={screenOpts} screenListeners={tabLsnr}>
            <Tab.Screen name="Hotspots" component={HotspotsNavigator} />
            <Tab.Screen name="NFTs" component={NftsNavigator} />
          </Tab.Navigator>
        </ReAnimatedBox>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default CollectablesTabNavigator
