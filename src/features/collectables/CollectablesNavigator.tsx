import React, { memo } from 'react'
import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import CollectablesTopTabs from './CollectablesTopTabs'
import HotspotDetailsScreen from './HotspotDetailsScreen'
import AssertLocationScreen from './AssertLocationScreen'
import PaymentScreen from '../payment/PaymentScreen'
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
import CollectionScreen from './CollectionScreen'
import NftDetailsScreen from './NftDetailsScreen'

const CollectablesStack = createStackNavigator()

const screenOptions: StackNavigationOptions = {
  headerShown: false,
}

const CollectablesStackScreen = () => {
  return (
    <CollectablesStack.Navigator screenOptions={screenOptions}>
      <CollectablesStack.Screen
        name="CollectablesTopTab"
        component={CollectablesTopTabs}
      />
      <CollectablesStack.Screen
        name="HotspotDetailsScreen"
        component={HotspotDetailsScreen}
      />
      <CollectablesStack.Screen
        name="AssertLocationScreen"
        component={AssertLocationScreen}
      />
      <CollectablesStack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
      />

      <CollectablesStack.Screen
        name="ClaimRewardsScreen"
        component={ClaimRewardsScreen}
      />

      <CollectablesStack.Screen
        name="ClaimAllRewardsScreen"
        component={ClaimAllRewardsScreen}
      />
      <CollectablesStack.Screen
        name="ClaimingRewardsScreen"
        component={ClaimingRewardsScreen}
      />

      <CollectablesStack.Screen
        name="CollectionScreen"
        component={CollectionScreen}
      />

      <CollectablesStack.Screen
        name="NftDetailsScreen"
        component={NftDetailsScreen}
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
      />

      <CollectablesStack.Screen
        name="TransferCollectableScreen"
        component={TransferCollectableScreen}
      />

      <CollectablesStack.Screen
        name="AddressBookNavigator"
        component={AddressBookNavigator}
      />

      <CollectablesStack.Screen
        name="TransferCompleteScreen"
        component={TransferCompleteScreen}
      />
    </CollectablesStack.Navigator>
  )
}

export default memo(CollectablesStackScreen)
