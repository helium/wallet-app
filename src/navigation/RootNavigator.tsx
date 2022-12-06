import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { RootStackParamList } from './rootTypes'
import HomeNavigator from '../features/home/HomeNavigator'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import TabBarNavigator from './TabBarNavigator'
import { useAppStorage } from '../storage/AppStorageProvider'

const RootNavigator = () => {
  const colors = useColors()
  const { hasAccounts } = useAccountStorage()
  const { l1Network } = useAppStorage()

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

  const initialRouteName = useMemo(() => {
    if (hasAccounts) {
      return l1Network === 'helium' ? 'HomeNavigator' : 'TabBarNavigator'
    }
    return 'OnboardingNavigator'
  }, [hasAccounts, l1Network])

  return (
    <RootStack.Navigator initialRouteName={initialRouteName}>
      {l1Network === 'helium' ? (
        <RootStack.Screen
          name="HomeNavigator"
          component={HomeNavigator}
          options={screenOptions}
        />
      ) : (
        <RootStack.Screen
          name="TabBarNavigator"
          component={TabBarNavigator}
          options={screenOptions}
        />
      )}

      <RootStack.Screen
        name="OnboardingNavigator"
        component={OnboardingNavigator}
        options={screenOptions}
      />
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
