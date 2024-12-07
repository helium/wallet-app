import {
  StackNavigationOptions,
  TransitionPresets,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { memo, useMemo } from 'react'
import { ThemeProvider } from '@shopify/restyle'
import { darkTheme } from '@config/theme/theme'
import LedgerNavigator from '../ledger/LedgerNavigator'
import CreateImportAccountScreen from './CreateImportAccountScreen'
import CreateAccountNavigator from './create/CreateAccountNavigator'
import ImportAccountNavigator from './import/ImportAccountNavigator'
import ImportPrivateKey from './import/ImportPrivateKey'
import { OnboardingStackParamList } from './onboardingTypes'
import KeystoneNavigator from '../keystone/KeystoneNavigator'
import WelcomeToHeliumScreen from './WelcomeToHeliumScreen'
import NewAccountScreen from './NewAccountScreen'

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
    <ThemeProvider theme={darkTheme}>
      <OnboardingStack.Navigator screenOptions={screenOptions}>
        <OnboardingStack.Screen
          name="WelcomeToHelium"
          component={WelcomeToHeliumScreen}
        />
        <OnboardingStack.Screen
          name="NewAccount"
          component={NewAccountScreen}
        />
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
          name="KeystoneNavigator"
          component={KeystoneNavigator}
          options={subScreenOptions}
        />
        <OnboardingStack.Screen
          name="ImportPrivateKey"
          component={ImportPrivateKey}
          options={subScreenOptions}
        />
      </OnboardingStack.Navigator>
    </ThemeProvider>
  )
}
export default memo(OnboardingNavigator)
