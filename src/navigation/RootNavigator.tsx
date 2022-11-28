import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import HomeNavigator from '../features/home/HomeNavigator'
import { RootStackParamList } from './rootTypes'

const RootNavigator = () => {
  const colors = useColors()
  const { hasAccounts } = useAccountStorage()

  const RootStack = createStackNavigator<RootStackParamList>()

  const screenOptions = useMemo(
    () =>
      ({
        headerShown: false,
      } as StackNavigationOptions),
    [],
  )

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  return (
    <RootStack.Navigator
      initialRouteName={hasAccounts ? 'HomeNavigator' : 'OnboardingNavigator'}
    >
      <RootStack.Screen
        name="OnboardingNavigator"
        component={OnboardingNavigator}
        options={screenOptions}
      />
      <RootStack.Screen
        name="HomeNavigator"
        component={HomeNavigator}
        options={screenOptions}
      />
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
