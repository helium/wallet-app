import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import React, { memo, useMemo } from 'react'
import CreateImportAccountScreen from './CreateImportAccountScreen'
import IntroScreen from './IntroScreen'
import OnboardingNavigator from './OnboardingNavigator'

const OnboardingParentStack = createStackNavigator()

const OnboardingParentNavigator = () => {
  const screenOptions = useMemo(
    () =>
      ({
        headerShown: false,
      } as StackNavigationOptions),
    [],
  )
  return (
    <OnboardingParentStack.Navigator screenOptions={screenOptions}>
      <OnboardingParentStack.Screen name="Intro" component={IntroScreen} />
      <OnboardingParentStack.Screen
        name="CreateImport"
        component={CreateImportAccountScreen}
      />
      <OnboardingParentStack.Screen
        name="OnboardingNavigator"
        component={OnboardingNavigator}
      />
    </OnboardingParentStack.Navigator>
  )
}
export default memo(OnboardingParentNavigator)
