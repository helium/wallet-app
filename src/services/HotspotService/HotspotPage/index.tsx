import {
  StackNavigationOptions,
  StackNavigationProp,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { useMemo } from 'react'
import { useColors } from '@theme/themeHooks'
import AssertLocationScreen from '@features/collectables/AssertLocationScreen'
import TransferCollectableScreen from '@features/collectables/TransferCollectableScreen'
import ChangeRewardsRecipientScreen from '@features/collectables/ChangeRewardsRecipientScreen'
import AntennaSetupScreen from '@features/collectables/AntennaSetupScreen'
import Diagnostics from '@features/collectables/Diagnostics'
import ModifyWifiScreen from '@features/collectables/ModifyWifiScreen'
import { HotspotWithPendingRewards } from '../../../types/solana'
import HotspotPage from './HotspotPage'
import HotspotDetails from './HotspotDetails'
import HotspotConfig from './HotspotConfig'

export type HotspotStackParamList = {
  HotspotPage: undefined
  HotspotDetails: {
    hotspot: HotspotWithPendingRewards
  }
  HotspotConfig: {
    hotspot: HotspotWithPendingRewards
    hotspotAddress: string
  }
  AssertLocationScreen: {
    collectable: HotspotWithPendingRewards
  }
  TransferCollectableScreen: {
    collectable: HotspotWithPendingRewards
  }
  ChangeRewardsRecipientScreen: {
    hotspot: HotspotWithPendingRewards
  }
  AntennaSetupScreen: {
    collectable: HotspotWithPendingRewards
  }
  DiagnosticsScreen: {
    collectable: HotspotWithPendingRewards
  }
  ModifyWifiScreen: {
    collectable: HotspotWithPendingRewards
  }
}

export type HotspotNavigationProp = StackNavigationProp<HotspotStackParamList>

const HotspotStack = createStackNavigator<HotspotStackParamList>()

const HotspotPageNavigator = () => {
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
    <HotspotStack.Navigator screenOptions={navigatorScreenOptions}>
      <HotspotStack.Screen name="HotspotPage" component={HotspotPage} />
      <HotspotStack.Screen name="HotspotDetails" component={HotspotDetails} />
      <HotspotStack.Screen name="HotspotConfig" component={HotspotConfig} />
      <HotspotStack.Screen
        name="AssertLocationScreen"
        component={AssertLocationScreen}
      />
      <HotspotStack.Screen
        name="TransferCollectableScreen"
        component={TransferCollectableScreen}
      />
      <HotspotStack.Screen
        name="ChangeRewardsRecipientScreen"
        component={ChangeRewardsRecipientScreen}
      />
      <HotspotStack.Screen
        name="AntennaSetupScreen"
        component={AntennaSetupScreen}
      />
      <HotspotStack.Screen name="DiagnosticsScreen" component={Diagnostics} />
      <HotspotStack.Screen
        name="ModifyWifiScreen"
        component={ModifyWifiScreen}
      />
    </HotspotStack.Navigator>
  )
}

export default HotspotPageNavigator
