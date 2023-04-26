import React, { FC, useCallback } from 'react'
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs'
import { useTranslation } from 'react-i18next'
import { RouteProp } from '@react-navigation/native'
import { SvgProps } from 'react-native-svg'
import Hotspot from '@assets/images/hotspot.svg'
import NFT from '@assets/images/nft.svg'
import Box from '@components/Box'
import { Font } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import HotspotList from './HotspotList'
import NftList from './NftList'
import SafeAreaBox from '../../components/SafeAreaBox'

const Tab = createMaterialTopTabNavigator()

export type CollectablesTabParamList = {
  Hotspots: undefined
  NFTs: undefined
}

const CollectablesTopTabs = () => {
  const { t } = useTranslation()
  const colors = useColors()

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

  return (
    <SafeAreaBox flex={1}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore This warning is a bug with @react-navigation */}
      <Tab.Navigator screenOptions={screenOpts}>
        <Tab.Screen name="Hotspots" component={HotspotList} />
        <Tab.Screen name="NFTs" component={NftList} />
      </Tab.Navigator>
    </SafeAreaBox>
  )
}

export default CollectablesTopTabs
