import * as React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import WelcomeScreen from './WelcomeScreen'
import AccountCreatePassphraseScreen from './AccountCreatePassphraseScreen'
import { OnboardingStackParamList } from './onboardingTypes'
import AccountEnterPassphraseScreen from './AccountEnterPassphraseScreen'
import AccountAssignScreen from './AccountAssignScreen'
import AccountImportCompleteScreen from './AccountImportCompleteScreen'
import AccountImportScreen from './AccountImportScreen'
import ImportAccountConfirmScreen from './ImportAccountConfirmScreen'

const MultiAccountStack = createStackNavigator<OnboardingStackParamList>()

const MultiAccountNavigator = () => {
  return (
    <MultiAccountStack.Navigator screenOptions={{ headerShown: false }}>
      <MultiAccountStack.Screen name="Welcome" component={WelcomeScreen} />
      <MultiAccountStack.Screen
        name="AccountCreatePassphraseScreen"
        component={AccountCreatePassphraseScreen}
      />
      <MultiAccountStack.Screen
        name="AccountEnterPassphraseScreen"
        component={AccountEnterPassphraseScreen}
      />
      <MultiAccountStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <MultiAccountStack.Screen
        name="AccountImportScreen"
        component={AccountImportScreen}
      />
      <MultiAccountStack.Screen
        name="ImportAccountConfirmScreen"
        component={ImportAccountConfirmScreen}
      />
      <MultiAccountStack.Screen
        name="AccountImportCompleteScreen"
        component={AccountImportCompleteScreen}
      />
    </MultiAccountStack.Navigator>
  )
}

export default MultiAccountNavigator
