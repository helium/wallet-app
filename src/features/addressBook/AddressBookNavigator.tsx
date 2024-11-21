import React, { memo, useMemo } from 'react'
import { useColors } from '@config/theme/themeHooks'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import AddressBook from './AddressBook'
import AddNewContact from './AddNewContact'
import EditContact from './EditContact'
import AddressQrScanner from './AddressQrScanner'

const AddressBookStack = createStackNavigator()

const AddressBookNavigator = () => {
  const colors = useColors()

  const navigatorScreenOptions = useMemo(
    () =>
      ({
        headerShown: false,
        cardStyle: { backgroundColor: colors.primaryBackground },
      } as StackNavigationOptions),
    [colors],
  )

  return (
    <AddressBookStack.Navigator screenOptions={navigatorScreenOptions}>
      <AddressBookStack.Screen name="AddressBook" component={AddressBook} />
      <AddressBookStack.Screen name="AddNewContact" component={AddNewContact} />
      <AddressBookStack.Screen name="EditContact" component={EditContact} />
      <AddressBookStack.Screen
        name="ScanAddress"
        component={AddressQrScanner}
      />
    </AddressBookStack.Navigator>
  )
}

export default memo(AddressBookNavigator)
