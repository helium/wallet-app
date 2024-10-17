import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { memo, useMemo } from 'react'
import { useColors } from '@theme/themeHooks'
import AddNewContact from '../addressBook/AddNewContact'
import AddressBookNavigator from '../addressBook/AddressBookNavigator'
import AddressQrScanner from '../addressBook/AddressQrScanner'
import OnboardingNav from '../hotspot-onboarding/OnboardingNav'
import PaymentQrScanner from '../payment/PaymentQrScanner'
import PaymentScreen from '../payment/PaymentScreen'
import AntennaSetupScreen from './AntennaSetupScreen'
import ClaimAllRewardsScreen from './ClaimAllRewardsScreen'
import ClaimRewardsScreen from './ClaimRewardsScreen'
import ClaimingRewardsScreen from './ClaimingRewardsScreen'
import CollectionScreen from './CollectionScreen'
import NftDetailsScreen from './NftDetailsScreen'
import SettingUpAntennaScreen from './SettingUpAntennaScreen'
import TransferCollectableScreen from './TransferCollectableScreen'
import TransferCompleteScreen from './TransferCompleteScreen'
import HotspotMapScreen from './HotspotMapScreen'
import AssertLocationScreen from './AssertLocationScreen'
import ChangeRewardsRecipientScreen from './ChangeRewardsRecipientScreen'
import HotspotList from './HotspotList'

const CollectablesStack = createStackNavigator()

const CollectablesStackScreen = () => {
  const colors = useColors()
  const screenOptions: StackNavigationOptions = useMemo(
    () => ({
      headerShown: false,
      cardStyle: { backgroundColor: colors.primaryBackground },
    }),
    [colors],
  )

  return (
    <CollectablesStack.Navigator screenOptions={screenOptions}>
      <CollectablesStack.Screen name="HotspotList" component={HotspotList} />
      <CollectablesStack.Screen
        name="HotspotMapScreen"
        component={HotspotMapScreen}
      />
      <CollectablesStack.Screen
        name="AssertLocationScreen"
        component={AssertLocationScreen}
      />
      <CollectablesStack.Screen
        name="AntennaSetupScreen"
        component={AntennaSetupScreen}
      />
      <CollectablesStack.Screen
        name="SettingUpAntennaScreen"
        component={SettingUpAntennaScreen}
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
      <CollectablesStack.Screen
        key="OnboardingNavigator"
        name="OnboardingNavigator"
        component={OnboardingNav}
        options={screenOptions}
      />
      <CollectablesStack.Screen
        name="ChangeRewardsRecipientScreen"
        component={ChangeRewardsRecipientScreen}
      />
    </CollectablesStack.Navigator>
  )
}

export default memo(CollectablesStackScreen)
