import { PortalHost } from '@gorhom/portal'
import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
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

const GovernanceStack = createStackNavigator()
const screenOptions: StackNavigationOptions = {
  headerShown: false,
  animationEnabled: false,
}

const GovernanceStackScreen = () => {
  const { voteTutorialShown } = useAppStorage()

  return (
    <>
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
        <GovernanceStack.Screen
          name="ProxiesScreen"
          component={ProxiesScreen}
        />
        <GovernanceStack.Screen
          name="ProposalScreen"
          component={ProposalScreen}
        />
        <GovernanceStack.Screen name="ProxyScreen" component={ProxyScreen} />
        <GovernanceStack.Screen
          name="AssignProxyScreen"
          component={AssignProxyScreen}
        />
        <GovernanceStack.Screen
          name="RevokeProxyScreen"
          component={RevokeProxyScreen}
        />
      </GovernanceStack.Navigator>
      <PortalHost name="GovernancePortalHost" />
    </>
  )
}

export default memo(GovernanceStackScreen)
