import {
  StackNavigationOptions,
  TransitionPresets,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { memo, useMemo } from 'react'
import LedgerNavigator from '../ledger/LedgerNavigator'
import CreateImportAccountScreen from './CreateImportAccountScreen'
import CreateAccountNavigator from './create/CreateAccountNavigator'
import ImportAccountNavigator from './import/ImportAccountNavigator'
import ImportPrivateKey from './import/ImportPrivateKey'
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
      <OnboardingStack.Screen
        name="ImportPrivateKey"
        component={ImportPrivateKey}
        options={subScreenOptions}
      />
    </OnboardingStack.Navigator>
  )
}
export default memo(OnboardingNavigator)
