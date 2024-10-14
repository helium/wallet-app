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
import NftDetailsScreen from '@features/collectables/NftDetailsScreen'
import CollectionScreen from '@features/collectables/CollectionScreen'
import ManageCollectables from '@features/collectables/ManageCollectables'
import TransferCollectableScreen from '@features/collectables/TransferCollectableScreen'
import { Collectable, CompressedNFT } from '../../../../types/solana'
import TokensTabs from './TokensTabs'

export type BurnRouteParam = {
  address: string
  amount?: string
  memo?: string
  isDelegate?: boolean
  mint?: string
}

export type WalletStackParamList = {
  TokensTabs: undefined
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
  TransferCollectableScreen: {
    collectable: CompressedNFT | Collectable
  }
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
      <WalletStack.Screen name="TokensTabs" component={TokensTabs} />
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

      <WalletStack.Screen
        name="TransferCollectableScreen"
        component={TransferCollectableScreen}
      />
    </WalletStack.Navigator>
  )
}

export default WalletPageNavigator
