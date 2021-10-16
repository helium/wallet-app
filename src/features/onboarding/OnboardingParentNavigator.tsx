import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import CreateImportAccountScreen from './CreateImportAccountScreen'
import OnboardingNavigator from './OnboardingNavigator'

const OnboardingParentStack = createStackNavigator()

const OnboardingParentNavigator = () => {
  return (
    <OnboardingParentStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
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
export default OnboardingParentNavigator
