import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { createStackNavigator } from '@react-navigation/stack'
import { useColors } from '../theme/themeHooks'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import HomeNavigator from '../features/home/HomeNavigator'

const RootNavigator = () => {
  const colors = useColors()
  const { accounts } = useAccountStorage()
  const RootStack = createStackNavigator()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const hasAccounts = useMemo(
    () => !!Object.keys(accounts || {}).length,
    [accounts],
  )

  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false, presentation: 'modal' }}
    >
      {hasAccounts ? (
        <RootStack.Screen
          name="HomeNavigator"
          component={HomeNavigator}
          options={{ animationTypeForReplace: 'pop' }}
        />
      ) : (
        <RootStack.Screen
          name="OnboardingNavigator"
          component={OnboardingNavigator}
          options={{ animationTypeForReplace: 'pop' }}
        />
      )}
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
