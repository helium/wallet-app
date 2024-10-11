import {
  StackNavigationOptions,
  StackNavigationProp,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { useMemo } from 'react'
import AccountTokenScreen from '@features/account/AccountTokenScreen'
import { useColors } from '@theme/themeHooks'
import AirdropScreen from '@features/account/AirdropScreen'
import ConfirmPinScreen from '@components/ConfirmPinScreen'
import BurnScreen from '@features/burn/BurnScreen'
import AccountManageTokenListScreen from '@features/account/AccountManageTokenListScreen'
import PaymentQrScanner from '@features/payment/PaymentQrScanner'
import AddNewContact from '@features/addressBook/AddNewContact'
import TokensTabs from './TokensTabs'
import NftDetailsScreen from '@features/collectables/NftDetailsScreen'
import { Collectable } from '../../../../types/solana'
import CollectionScreen from '@features/collectables/CollectionScreen'
import ManageCollectables from '@features/collectables/ManageCollectables'

export type BurnRouteParam = {
  address: string
  amount?: string
  memo?: string
  isDelegate?: boolean
  mint?: string
}

export type WalletStackParamList = {
  TokensScreen: undefined
  AccountTokenScreen: { mint: string }
  AirdropScreen: { mint: string }
  ConfirmPin: {
    action: 'payment'
  }
  BurnScreen: BurnRouteParam
  AccountManageTokenListScreen: undefined
  PaymentQrScanner: undefined
  NftDetailsScreen: {
    collectable: Collectable
  }
  CollectionScreen: {
    collection: Collectable[]
  }
  ManageCollectables: undefined
}

export type WalletNavigationProp = StackNavigationProp<WalletStackParamList>

const WalletStack = createStackNavigator<WalletStackParamList>()

const WalletPageNavigator = () => {
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
    <WalletStack.Navigator screenOptions={navigatorScreenOptions}>
      <WalletStack.Screen name="TokensScreen" component={TokensTabs} />
      <WalletStack.Screen
        name="AccountTokenScreen"
        component={AccountTokenScreen}
      />
      <WalletStack.Screen name="AirdropScreen" component={AirdropScreen} />
      <WalletStack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <WalletStack.Screen name="BurnScreen" component={BurnScreen} />
      <WalletStack.Screen
        name="AccountManageTokenListScreen"
        component={AccountManageTokenListScreen}
      />
      <WalletStack.Screen
        name="PaymentQrScanner"
        component={PaymentQrScanner}
      />
      <WalletStack.Screen
        name="NftDetailsScreen"
        component={NftDetailsScreen}
      />
      <WalletStack.Screen
        name="CollectionScreen"
        component={CollectionScreen}
      />
      <WalletStack.Screen
        name="ManageCollectables"
        component={ManageCollectables}
      />
    </WalletStack.Navigator>
  )
}

export default WalletPageNavigator
