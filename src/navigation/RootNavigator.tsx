import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { RootStackParamList } from './rootTypes'
import HomeNavigator from '../features/home/HomeNavigator'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import TabBarNavigator from './TabBarNavigator'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAppDispatch } from '../store/store'
import { HomeNavigationProp } from '../features/home/homeTypes'
import { appSlice } from '../store/slices/appSlice'
import ConnectedWallets, {
  ConnectedWalletsRef,
} from '../features/account/ConnectedWallets'
import { RootState } from '../store/rootReducer'
import { useGetBetaPubkeysQuery } from '../store/slices/walletRestApi'

const RootNavigator = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const colors = useColors()
  const { hasAccounts, currentAccount } = useAccountStorage()
  const { l1Network, updateL1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const RootStack = createStackNavigator<RootStackParamList>()
  const connectedWalletsRef = useRef<ConnectedWalletsRef>(null)
  const { data: betaAccess } = useGetBetaPubkeysQuery()

  const screenOptions = useMemo(
    () =>
      ({
        headerShown: false,
      } as StackNavigationOptions),
    [],
  )

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  // Edge case scenario where user is on testflight and has solana preview on then installs app store version.
  useEffect(() => {
    if (!betaAccess?.publicKeys?.includes(currentAccount?.address || '')) {
      updateL1Network('helium')
    }
  }, [betaAccess, currentAccount, updateL1Network])

  const initialRouteName = useMemo(() => {
    if (hasAccounts) {
      return l1Network === 'helium' ? 'HomeNavigator' : 'TabBarNavigator'
    }
    return 'OnboardingNavigator'
  }, [hasAccounts, l1Network])

  const handleAddNew = useCallback(() => {
    navigation.navigate('AddNewAccountNavigator')
  }, [navigation])

  const onConnectedWalletsClose = useCallback(() => {
    dispatch(appSlice.actions.toggleConnectedWallets())
  }, [dispatch])

  const showConnectedWallets = useSelector(
    (state: RootState) => state.app.showConnectedWallets,
  )

  useEffect(() => {
    if (showConnectedWallets) {
      connectedWalletsRef.current?.show()
    }
  }, [showConnectedWallets])

  return (
    <ConnectedWallets
      onAddNew={handleAddNew}
      ref={connectedWalletsRef}
      onClose={onConnectedWalletsClose}
    >
      <RootStack.Navigator initialRouteName={initialRouteName}>
        {l1Network === 'helium' ? (
          <RootStack.Screen
            name="HomeNavigator"
            component={HomeNavigator}
            options={screenOptions}
          />
        ) : (
          <RootStack.Screen
            name="TabBarNavigator"
            component={TabBarNavigator}
            options={screenOptions}
          />
        )}

        <RootStack.Screen
          name="OnboardingNavigator"
          component={OnboardingNavigator}
          options={screenOptions}
        />
      </RootStack.Navigator>
    </ConnectedWallets>
  )
}

export default memo(RootNavigator)
