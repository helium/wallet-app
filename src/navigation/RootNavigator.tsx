import {
  HELIUM_DERIVATION,
  keypairFromSeed,
  solanaDerivation,
} from '@hooks/useDerivationAccounts'
import { useNavigation } from '@react-navigation/native'
import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { CSAccount } from '@storage/cloudStorage'
import { getSecureAccount } from '@storage/secureStorage'
import { useColors } from '@theme/themeHooks'
import * as bip39 from 'bip39'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import Toast from 'react-native-simple-toast'
import { useSelector } from 'react-redux'
import ConnectedWallets, {
  ConnectedWalletsRef,
} from '../features/account/ConnectedWallets'
import DappLoginScreen from '../features/dappLogin/DappLoginScreen'
import { HomeNavigationProp } from '../features/home/homeTypes'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import { useOnboarding } from '../features/onboarding/OnboardingProvider'
import ImportPrivateKey from '../features/onboarding/import/ImportPrivateKey'
import PaymentScreen from '../features/payment/PaymentScreen'
import LinkWallet from '../features/txnDelegation/LinkWallet'
import SignHotspot from '../features/txnDelegation/SignHotspot'
import { RootState } from '../store/rootReducer'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'
import TabBarNavigator from './TabBarNavigator'
import {
  RootNavigationProp,
  RootStackParamList,
  TabBarNavigationProp,
} from './rootTypes'

const screenOptions = { headerShown: false } as StackNavigationOptions

const RootNavigator = () => {
  const navigation = useNavigation<
    RootNavigationProp & HomeNavigationProp & TabBarNavigationProp
  >()
  const colors = useColors()
  const RootStack = createStackNavigator<RootStackParamList>()
  const connectedWalletsRef = useRef<ConnectedWalletsRef>(null)
  const dispatch = useAppDispatch()
  const { setOnboardingData, onboardingData } = useOnboarding()
  const { currentAccount, accounts } = useAccountStorage()
  const { result: seed } = useAsync(async () => {
    if (currentAccount) {
      const storage = await getSecureAccount(currentAccount.address)
      return bip39.mnemonicToSeedSync(storage?.mnemonic?.join(' ') || '', '')
    }
  }, [currentAccount])

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const handleAddNew = useCallback(() => {
    navigation.navigate('AddNewAccountNavigator')
  }, [navigation])

  const { execute: handleAddSub } = useAsyncCallback(async (acc: CSAccount) => {
    try {
      if (!seed || !acc?.derivationPath) {
        throw new Error('Missing seed or derivation path')
      }
      const currentPath = acc.derivationPath
      const takenAddresses = new Set(
        Object.values(accounts || {}).map((a) => a.solanaAddress),
      )
      let currentAccountNum =
        currentPath === HELIUM_DERIVATION
          ? 0
          : Number(currentPath.split('/')[3].replace("'", '')) + 1
      let derivationPath = solanaDerivation(currentAccountNum, 0)
      let keypair = await keypairFromSeed(seed, derivationPath)
      while (
        currentAccountNum < 100 &&
        (!keypair || takenAddresses.has(keypair.publicKey.toBase58()))
      ) {
        currentAccountNum += 1
        derivationPath = solanaDerivation(currentAccountNum, 0)
        keypair = await keypairFromSeed(seed, derivationPath)
      }
      if (currentAccountNum >= 100) {
        throw new Error('More than 100 accounts are not supported')
      }
      if (keypair) {
        const words = (await getSecureAccount(acc.address))?.mnemonic
        setOnboardingData({
          ...onboardingData,
          words,
          paths: [
            {
              derivationPath,
              keypair,
            },
          ],
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        navigation.navigate('TabBarNavigator', {
          screen: 'Home',
          params: {
            screen: 'AccountAssignScreen',
            params: {
              words,
            },
          },
        })
        connectedWalletsRef.current?.hide()
      }
    } catch (e: any) {
      Toast.show(e.message || e.toString())
    }
  })

  const showConnectedWallets = useSelector(
    (state: RootState) => state.app.showConnectedWallets,
  )

  const onClose = useCallback(() => {
    dispatch(appSlice.actions.toggleConnectedWallets())
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
      onAddSub={handleAddSub}
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
