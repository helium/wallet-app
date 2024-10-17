import {
  StackNavigationOptions,
  StackNavigationProp,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { useMemo } from 'react'
import { useColors } from '@theme/themeHooks'
import PaymentScreen from '@features/payment/PaymentScreen'
import AddressBookNavigator from '@features/addressBook/AddressBookNavigator'
import { PaymentRouteParam } from '@services/WalletService'

export type SendStackParamList = {
  PaymentScreen: undefined | PaymentRouteParam
  AddressBook: undefined
}

export type SendNavigationProp = StackNavigationProp<SendStackParamList>

const SendStack = createStackNavigator<SendStackParamList>()

const SendPageNavigator = () => {
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
    <SendStack.Navigator screenOptions={navigatorScreenOptions}>
      <SendStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <SendStack.Screen name="AddressBook" component={AddressBookNavigator} />
    </SendStack.Navigator>
  )
}

export default SendPageNavigator
