import * as React from 'react'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { memo } from 'react'
import AccountCreatePassphraseScreen from './AccountCreatePassphraseScreen'
import AccountEnterPassphraseScreen from './AccountEnterPassphraseScreen'
import { CreateAccountStackParamList } from './createAccountNavTypes'
import AccountAssignScreen from '../AccountAssignScreen'
import AccountCreatePinScreen from '../AccountCreatePinScreen'
import AccountConfirmPinScreen from '../AccountConfirmPinScreen'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import AccountCreateStartScreen from './AccountCreateStartScreen'

const CreateAccountStack = createStackNavigator<CreateAccountStackParamList>()
const CreateAccountNavigator = () => {
  const { sortedAccounts } = useAccountStorage()

  const screenOptions = React.useMemo(
    () =>
      ({
        headerShown: false,
      } as StackNavigationOptions),
    [],
  )
  return (
    <CreateAccountStack.Navigator screenOptions={screenOptions}>
      {sortedAccounts.length === 0 && (
        <CreateAccountStack.Screen
          name="AccountCreateStartScreen"
          component={AccountCreateStartScreen}
        />
      )}
      <CreateAccountStack.Screen
        name="AccountCreatePassphraseScreen"
        component={AccountCreatePassphraseScreen}
      />
      <CreateAccountStack.Screen
        name="AccountEnterPassphraseScreen"
        component={AccountEnterPassphraseScreen}
      />
      <CreateAccountStack.Screen
        name="AccountAssignScreen"
        component={AccountAssignScreen}
      />
      <CreateAccountStack.Screen
        name="AccountCreatePinScreen"
        component={AccountCreatePinScreen}
      />
      <CreateAccountStack.Screen
        name="AccountConfirmPinScreen"
        component={AccountConfirmPinScreen}
      />
    </CreateAccountStack.Navigator>
  )
}

export default memo(CreateAccountNavigator)
