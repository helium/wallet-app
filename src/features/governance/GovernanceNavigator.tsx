import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import { useAppStorage } from '@storage/AppStorageProvider'
import React, { memo } from 'react'
import AssignProxyScreen from './AssignProxyScreen'
import GovernanceTutorialScreen from './GovernanceTutorialScreen'
import PositionsScreen from './PositionsScreen'
import ProposalScreen from './ProposalScreen'
import ProposalsScreen from './ProposalsScreen'
import RevokeProxyScreen from './RevokeProxyScreen'
import ProxyScreen from './ProxyScreen'
import ProxiesScreen from './ProxiesScreen'

const GovernanceStack = createNativeStackNavigator()
// Peer views switch in place; detail screens push with the platform animation.
const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'none',
}
const detailOptions: NativeStackNavigationOptions = { animation: 'default' }

const GovernanceStackScreen = () => {
  const { voteTutorialShown } = useAppStorage()

  return (
    <GovernanceStack.Navigator screenOptions={screenOptions}>
      {!voteTutorialShown && (
        <GovernanceStack.Screen
          name="GovernanceTutorialScreen"
          component={GovernanceTutorialScreen}
        />
      )}
      <GovernanceStack.Screen
        name="ProposalsScreen"
        component={ProposalsScreen}
      />
      <GovernanceStack.Screen
        name="PositionsScreen"
        component={PositionsScreen}
      />
      <GovernanceStack.Screen name="ProxiesScreen" component={ProxiesScreen} />
      <GovernanceStack.Screen
        name="ProposalScreen"
        component={ProposalScreen}
        options={detailOptions}
      />
      <GovernanceStack.Screen
        name="ProxyScreen"
        component={ProxyScreen}
        options={detailOptions}
      />
      <GovernanceStack.Screen
        name="AssignProxyScreen"
        component={AssignProxyScreen}
        options={detailOptions}
      />
      <GovernanceStack.Screen
        name="RevokeProxyScreen"
        component={RevokeProxyScreen}
        options={detailOptions}
      />
    </GovernanceStack.Navigator>
  )
}

export default memo(GovernanceStackScreen)
