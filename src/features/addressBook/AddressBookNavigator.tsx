import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useResolveClassNames } from 'uniwind'
import AddressBook from './AddressBook'
import AddNewContact from './AddNewContact'
import EditContact from './EditContact'
import AddressQrScanner from './AddressQrScanner'

const AddressBookStack = createNativeStackNavigator()

const AddressBookNavigator = () => {
  const contentStyle = useResolveClassNames('bg-background')
  return (
    <AddressBookStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle,
        presentation: 'modal',
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

export default AddressBookNavigator
