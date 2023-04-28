import React, { memo, useCallback, useEffect, useRef } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { useColors } from '@theme/themeHooks'
import {
  RootStackParamList,
  RootNavigationProp,
  TabBarNavigationProp,
} from './rootTypes'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import TabBarNavigator from './TabBarNavigator'
import { HomeNavigationProp } from '../features/home/homeTypes'
import ConnectedWallets, {
  ConnectedWalletsRef,
} from '../features/account/ConnectedWallets'
import { RootState } from '../store/rootReducer'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'
import { walletRestApi } from '../store/slices/walletRestApi'
import LinkWallet from '../features/txnDelegation/LinkWallet'
import PaymentScreen from '../features/payment/PaymentScreen'
import SignHotspot from '../features/txnDelegation/SignHotspot'
import DappLoginScreen from '../features/dappLogin/DappLoginScreen'
import ImportPrivateKey from '../features/onboarding/import/ImportPrivateKey'

const screenOptions = { headerShown: false } as StackNavigationOptions

const RootNavigator = () => {
  const navigation = useNavigation<
    RootNavigationProp & HomeNavigationProp & TabBarNavigationProp
  >()
  const colors = useColors()
  const RootStack = createStackNavigator<RootStackParamList>()
  const connectedWalletsRef = useRef<ConnectedWalletsRef>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const handleAddNew = useCallback(() => {
    navigation.navigate('AddNewAccountNavigator')
  }, [navigation])

  const showConnectedWallets = useSelector(
    (state: RootState) => state.app.showConnectedWallets,
  )

  const onClose = useCallback(() => {
    dispatch(appSlice.actions.toggleConnectedWallets())
  }, [dispatch])

  useEffect(() => {
    dispatch(walletRestApi.util.resetApiState())
  }, [dispatch])

  useEffect(() => {
    if (showConnectedWallets) {
      connectedWalletsRef.current?.show()
    }
  }, [showConnectedWallets])

  return (
    <ConnectedWallets
      onAddNew={handleAddNew}
      ref={connectedWalletsRef}
      onClose={onClose}
    >
      <RootStack.Navigator screenOptions={screenOptions}>
        <RootStack.Screen
          name="TabBarNavigator"
          component={TabBarNavigator}
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
      </RootStack.Navigator>
    </ConnectedWallets>
  )
}

export default memo(RootNavigator)
