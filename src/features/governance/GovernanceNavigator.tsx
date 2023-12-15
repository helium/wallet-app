import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { memo } from 'react'
import { PortalHost } from '@gorhom/portal'
import { useAppStorage } from '@storage/AppStorageProvider'
import GovernanceTutorialScreen from './GovernanceTutorialScreen'
import GovernanceScreen from './GovernanceScreen'
import ProposalScreen from './ProposalScreen'
import VotingPowerScreen from './VotingPowerScreen'

const GovernanceStack = createStackNavigator()
const screenOptions: StackNavigationOptions = {
  headerShown: false,
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
          name="GovernanceScreen"
          component={GovernanceScreen}
        />
        <GovernanceStack.Screen
          name="VotingPowerScreen"
          component={VotingPowerScreen}
        />
        <GovernanceStack.Screen
          name="ProposalScreen"
          component={ProposalScreen}
        />
      </GovernanceStack.Navigator>
      <PortalHost name="GovernancePortalHost" />
    </>
  )
}

export default memo(GovernanceStackScreen)
