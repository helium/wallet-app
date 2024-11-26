import SegmentedControl, {
  SegmentedControlRef,
} from '@components/SegmentedControl'
import React, { useCallback, useMemo, useRef } from 'react'
import Tokens from '@assets/svgs/tokens.svg'
import Collectables from '@assets/svgs/collectables.svg'
import {
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { StackNavigationProp } from '@react-navigation/stack'
import NftList from '@features/collectables/NftList'
import { useColors } from '@config/theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import TokensScreen from './TokensScreen'

export type TokensStackParamList = {
  TokensScreen: undefined
  NftList: undefined
}

export type TokensNavigationProp = StackNavigationProp<TokensStackParamList>

const TokensStack = createMaterialTopTabNavigator()

const TokensTabs = () => {
  const segmentedControlRef = useRef<SegmentedControlRef>(null)
  const colors = useColors()
  const navigatorScreenOptions = useMemo(
    () =>
      ({
        headerShown: false,
        swipeEnabled: false,
      } as MaterialTopTabNavigationOptions),
    [],
  )
  const navigation = useNavigation<TokensNavigationProp>()

  const options = useMemo(
    () => [
      {
        value: 'tokens',
        label: 'Tokens',
        Icon: Tokens,
      },
      {
        value: 'collectables',
        label: 'Collectables',
        Icon: Collectables,
      },
    ],
    [],
  )

  const onItemSelected = useCallback(
    (index: number) => {
      if (index === 0) {
        navigation.navigate('TokensScreen')
      }

      if (index === 1) {
        navigation.navigate('NftList')
      }
    },
    [navigation],
  )

  const TopTabs = useCallback(() => {
    return (
      <SegmentedControl
        options={options}
        onItemSelected={onItemSelected}
        marginTop="3xl"
        marginBottom="xl"
        ref={segmentedControlRef}
      />
    )
  }, [onItemSelected, options])

  return (
    <TokensStack.Navigator
      screenOptions={navigatorScreenOptions}
      tabBar={TopTabs}
      sceneContainerStyle={{
        backgroundColor: colors.primaryBackground,
      }}
    >
      <TokensStack.Screen name="TokensScreen" component={TokensScreen} />
      <TokensStack.Screen name="NftList" component={NftList} />
    </TokensStack.Navigator>
  )
}

export default TokensTabs
