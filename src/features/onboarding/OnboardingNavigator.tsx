import React, { memo, useMemo } from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack'
import LedgerNavigator from '../ledger/LedgerNavigator'
import CreateImportAccountScreen from './CreateImportAccountScreen'
import IntroScreen from './IntroScreen'
import CreateAccountNavigator from './create/CreateAccountNavigator'
import ImportAccountNavigator from './import/ImportAccountNavigator'
import { OnboardingStackParamList } from './onboardingTypes'

const OnboardingStack = createStackNavigator<OnboardingStackParamList>()

const OnboardingNavigator = () => {
  const screenOptions = useMemo(
    () =>
      ({
        headerShown: false,
      } as StackNavigationOptions),
    [],
  )
  const subScreenOptions = useMemo(
    () =>
      ({
        headerShown: false,
        ...TransitionPresets.ModalPresentationIOS,
      } as StackNavigationOptions),
    [],
  )
  return (
    <OnboardingStack.Navigator screenOptions={screenOptions}>
      <OnboardingStack.Screen name="Intro" component={IntroScreen} />
      <OnboardingStack.Screen
        name="CreateImport"
        component={CreateImportAccountScreen}
      />
      <OnboardingStack.Screen
        name="CreateAccount"
        component={CreateAccountNavigator}
        options={subScreenOptions}
      />
      <OnboardingStack.Screen
        name="ImportAccount"
        component={ImportAccountNavigator}
        options={subScreenOptions}
      />
      <OnboardingStack.Screen
        name="LedgerNavigator"
        component={LedgerNavigator}
        options={subScreenOptions}
      />
    </OnboardingStack.Navigator>
  )
}
export default memo(OnboardingNavigator)
