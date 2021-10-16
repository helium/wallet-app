import React, { memo, useEffect } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { createStackNavigator } from '@react-navigation/stack'
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
          options={{
            animationTypeForReplace: 'pop',
          }}
        />
      ) : (
        <RootStack.Screen
          name="OnboardingParent"
          component={OnboardingParentNavigator}
          options={{
            animationTypeForReplace: 'pop',
          }}
        />
      )}
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
