import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingParentNavigator from '../features/onboarding/OnboardingParentNavigator'
import HomeNavigator from '../features/home/HomeNavigator'

const RootNavigator = () => {
  const colors = useColors()
  const { hasAccounts } = useAccountStorage()
  const RootStack = createStackNavigator()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const screenOptions = useMemo(
    (): StackNavigationOptions => ({
      animationTypeForReplace: 'pop',
    }),
    [],
  )

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
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
          name="OnboardingParent"
          component={OnboardingParentNavigator}
          options={screenOptions}
        />
      )}
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
