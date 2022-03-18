import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import HomeNavigator from '../features/home/HomeNavigator'

const RootNavigator = () => {
  const colors = useColors()
  const { hasAccounts } = useAccountStorage()
  const RootStack = createNativeStackNavigator()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const screenOptions = useMemo(
    (): NativeStackNavigationOptions => ({
      animationTypeForReplace: 'pop',
    }),
    [],
  )

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {hasAccounts ? (
        <RootStack.Screen
          name="HomeNavigator"
          component={HomeNavigator}
          options={screenOptions}
        />
      ) : (
        <RootStack.Screen
          name="OnboardingNavigator"
          component={OnboardingNavigator}
          options={screenOptions}
        />
      )}
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
