import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AddressBook from './AddressBook'
import AddNewContact from './AddNewContact'
import { useOpacity } from '../../theme/themeHooks'
import EditContact from './EditContact'
import AddressQrScanner from './AddressQrScanner'

const AddressBookStack = createNativeStackNavigator()

const AddressBookNavigator = () => {
  const { backgroundStyle } = useOpacity('primaryBackground', 0.98)
  return (
    <AddressBookStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: backgroundStyle,
      }}
    >
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
