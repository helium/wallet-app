import React, { FC } from 'react'
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs'
import { useTranslation } from 'react-i18next'
import { RouteProp } from '@react-navigation/native'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import Hotspot from '@assets/images/hotspot.svg'
import { Text } from '@ui/Text'
import { Image as ImageGlyph } from 'lucide-react-native'
import { useCSSVariable, withUniwind } from 'uniwind'
import HotspotList from './HotspotList'
import NftList from './NftList'

const Tab = createMaterialTopTabNavigator()
const SafeArea = withUniwind(SafeAreaView)

const EDGES = ['top'] as const

export type CollectablesTabParamList = {
  Hotspots: undefined
  NFTs: undefined
}

const TAB_ICONS: Record<keyof CollectablesTabParamList, FC<SvgProps>> = {
  Hotspots: Hotspot,
  NFTs: ImageGlyph,
}

const renderTabIcon =
  (name: keyof CollectablesTabParamList) =>
  ({ color }: { color: string }) => {
    const Icon = TAB_ICONS[name]
    return (
      <View className="h-full items-center justify-center">
        <Icon color={color} />
      </View>
    )
  }

const CollectablesTopTabs = () => {
  const { t } = useTranslation()
  const fontMedium = useCSSVariable('--font-medium') as string | undefined
  const background = useCSSVariable('--color-background') as string | undefined
  const foreground = useCSSVariable('--color-foreground') as string | undefined
  const mutedForeground = useCSSVariable('--color-muted-foreground') as
    string | undefined
  const border = useCSSVariable('--color-border') as string | undefined

  const screenOpts = ({
    route,
  }: {
    route: RouteProp<CollectablesTabParamList>
  }) =>
    ({
      lazy: true,
      headerShown: false,
      tabBarLabelStyle: {
        fontFamily: fontMedium,
        fontSize: 20,
        textTransform: 'none',
      },
      tabBarShowIcon: true,
      tabBarStyle: {
        backgroundColor: background,
        width: '100%',
      },
      tabBarContentContainerStyle: {
        borderBottomColor: border,
        borderBottomWidth: 1,
        justifyContent: 'center',
      },
      tabBarIndicatorStyle: {
        backgroundColor: foreground,
        height: 3,
        position: undefined,
      },
      tabBarIndicatorContainerStyle: {
        justifyContent: 'flex-end',
      },
      tabBarItemStyle: {
        flexDirection: 'row',
        flex: 1,
      },
      tabBarIcon: renderTabIcon(route.name),
      tabBarActiveTintColor: foreground,
      tabBarInactiveTintColor: mutedForeground,
      title: t(`collectablesScreen.${route.name.toLowerCase()}.title`),
    }) as MaterialTopTabNavigationOptions

  return (
    <SafeArea className="flex-1 bg-background" edges={EDGES}>
      <Text size="xl" className="mb-6 mt-4 self-center font-medium">
        {t('collectablesScreen.title')}
      </Text>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore This warning is a bug with @react-navigation */}
      <Tab.Navigator screenOptions={screenOpts}>
        <Tab.Screen name="Hotspots" component={HotspotList} />
        <Tab.Screen name="NFTs" component={NftList} />
      </Tab.Navigator>
    </SafeArea>
  )
}

export default CollectablesTopTabs
