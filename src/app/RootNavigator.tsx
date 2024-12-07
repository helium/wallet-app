import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import { useColors } from '@config/theme/themeHooks'
import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import ServiceSheetNavigator from '@services/ServiceSheetNavigator'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import ScanQrCodeScreen from '@features/keystone/ScanQrCodeScreen'
import SelectKeystoneAccountsScreen from '@features/keystone/SelectKeystoneAccountsScreen'
import DappLoginScreen from '@features/dappLogin/DappLoginScreen'
import OnboardingNavigator from '@features/onboarding/OnboardingNavigator'
import ImportPrivateKey from '@features/onboarding/import/ImportPrivateKey'
import PaymentScreen from '@features/payment/PaymentScreen'
import LinkWallet from '@features/txnDelegation/LinkWallet'
import SignHotspot from '@features/txnDelegation/SignHotspot'
import { useNavigation } from '@react-navigation/native'
import { RootNavigationProp, RootStackParamList } from './rootTypes'

const screenOptions = { headerShown: false } as StackNavigationOptions

const RootNavigator = () => {
  const { currentAccount } = useAccountStorage()
  const colors = useColors()
  const RootStack = createStackNavigator<RootStackParamList>()
  const rootNav = useNavigation<RootNavigationProp>()

  useEffect(() => {
    if (currentAccount) {
      changeNavigationBarColor(colors.primaryText, true, false)
    } else {
      changeNavigationBarColor(colors.primaryBackground, true, false)
    }
  }, [colors, currentAccount])

  const initialRouteName = useMemo(() => {
    return currentAccount ? 'ServiceSheetNavigator' : 'OnboardingNavigator'
  }, [currentAccount])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstRoute = (rootNav as any).getRootState().routes[0].key || ''
    if (currentAccount && firstRoute.includes('OnboardingNavigator')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(rootNav as any).reset({
        index: 0,
        routes: [{ name: 'ServiceSheetNavigator' }],
      })
    }
  }, [currentAccount, initialRouteName, rootNav])

  return (
    <RootStack.Navigator
      screenOptions={screenOptions}
      initialRouteName={initialRouteName}
    >
      <RootStack.Screen
        name="ServiceSheetNavigator"
        component={ServiceSheetNavigator}
        options={screenOptions}
      />
      <RootStack.Screen
        key="OnboardingNavigator"
        name="OnboardingNavigator"
        component={OnboardingNavigator}
        options={screenOptions}
      />
      <RootStack.Screen
        name="LinkWallet"
        component={LinkWallet}
        options={screenOptions}
      />
      <RootStack.Screen
        name="SignHotspot"
        component={SignHotspot}
        options={screenOptions}
      />
      <RootStack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
        options={screenOptions}
      />
      <RootStack.Screen
        name="DappLoginScreen"
        component={DappLoginScreen}
        options={screenOptions}
      />
      <RootStack.Screen
        name="ImportPrivateKey"
        component={ImportPrivateKey}
        options={screenOptions}
      />
      <RootStack.Screen
        name="SelectKeystoneAccounts"
        component={SelectKeystoneAccountsScreen}
        options={{
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="ScanQrCode"
        component={ScanQrCodeScreen}
        options={screenOptions}
      />
    </RootStack.Navigator>
  )
}

export default memo(RootNavigator)
