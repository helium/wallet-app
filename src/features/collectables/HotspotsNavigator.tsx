import React, { memo } from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import HotspotDetailsScreen from './HotspotDetailsScreen'
import PaymentScreen from '../payment/PaymentScreen'
import HotspotList from './HotspotList'
import AddNewContact from '../addressBook/AddNewContact'
import PaymentQrScanner from '../payment/PaymentQrScanner'
import AddressQrScanner from '../addressBook/AddressQrScanner'
import NftMetadataScreen from './NftMetadataScreen'
import TransferCollectableScreen from './TransferCollectableScreen'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'
import TransferCompleteScreen from './TransferCompleteScreen'
import ClaimRewardsScreen from './ClaimRewardsScreen'
import ClaimAllRewardsScreen from './ClaimAllRewardsScreen'
import ClaimingRewardsScreen from './ClaimingRewardsScreen'

const CollectablesStack = createNativeStackNavigator()

const cardPresentation: NativeStackNavigationOptions = {
  presentation: 'card',
  animation: 'slide_from_bottom',
}

const cardFadePresentation: NativeStackNavigationOptions = {
  presentation: 'card',
  animation: 'fade',
}

const modalPresentation: NativeStackNavigationOptions = {
  presentation: 'modal',
}

const HotspotsNavigator = () => {
  return (
    <CollectablesStack.Navigator
      screenOptions={{
        headerShown: false,
        ...modalPresentation,
      }}
    >
      <CollectablesStack.Screen
        name="HotspotListScreen"
        component={HotspotList}
      />
      <CollectablesStack.Screen
        name="HotspotDetailsScreen"
        component={HotspotDetailsScreen}
        options={cardPresentation}
      />

      <CollectablesStack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
      />

      <CollectablesStack.Screen
        name="AddNewContact"
        component={AddNewContact}
      />

      <CollectablesStack.Screen
        name="PaymentQrScanner"
        component={PaymentQrScanner}
      />
      <CollectablesStack.Screen
        name="ScanAddress"
        component={AddressQrScanner}
      />

      <CollectablesStack.Screen
        name="NftMetadataScreen"
        component={NftMetadataScreen}
        options={cardFadePresentation}
      />

      <CollectablesStack.Screen
        name="TransferCollectableScreen"
        component={TransferCollectableScreen}
        options={cardFadePresentation}
      />

      <CollectablesStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
        options={cardPresentation}
      />

      <CollectablesStack.Screen
        name="TransferCompleteScreen"
        component={TransferCompleteScreen}
        options={cardPresentation}
      />

      <CollectablesStack.Screen
        name="ClaimRewardsScreen"
        component={ClaimRewardsScreen}
        options={cardPresentation}
      />

      <CollectablesStack.Screen
        name="ClaimAllRewardsScreen"
        component={ClaimAllRewardsScreen}
        options={cardPresentation}
      />
      <CollectablesStack.Screen
        name="ClaimingRewardsScreen"
        component={ClaimingRewardsScreen}
        options={cardPresentation}
      />
    </CollectablesStack.Navigator>
  )
}
export default memo(HotspotsNavigator)
