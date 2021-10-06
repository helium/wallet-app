import * as React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import WelcomeScreen from './WelcomeScreen'
import AccountCreatePassphraseScreen from './AccountCreatePassphraseScreen'
import { OnboardingStackParamList } from './onboardingTypes'
import AccountEnterPassphraseScreen from './AccountEnterPassphraseScreen'
import AccountAssignScreen from './AccountAssignScreen'
import AccountCreatePinScreen from './AccountCreatePinScreen'
import AccountConfirmPinScreen from './AccountConfirmPinScreen'
import AccountImportCompleteScreen from './AccountImportCompleteScreen'
import AccountImportScreen from './AccountImportScreen'
import ImportAccountConfirmScreen from './ImportAccountConfirmScreen'

const OnboardingStack = createStackNavigator<OnboardingStackParamList>()

const OnboardingNavigator = () => {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen
        name="AccountCreatePassphraseScreen"
        component={AccountCreatePassphraseScreen}
      />
      <OnboardingStack.Screen
        name="AccountEnterPassphraseScreen"
        component={AccountEnterPassphraseScreen}
      />
      <OnboardingStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <OnboardingStack.Screen
        name="AccountCreatePinScreen"
        component={AccountCreatePinScreen}
      />
      <OnboardingStack.Screen
        name="AccountConfirmPinScreen"
        component={AccountConfirmPinScreen}
      />
      <OnboardingStack.Screen
        name="AccountImportScreen"
        component={AccountImportScreen}
      />
      <OnboardingStack.Screen
        name="ImportAccountConfirmScreen"
        component={ImportAccountConfirmScreen}
      />
      <OnboardingStack.Screen
        name="AccountImportCompleteScreen"
        component={AccountImportCompleteScreen}
      />
    </OnboardingStack.Navigator>
  )
}

export default OnboardingNavigator
