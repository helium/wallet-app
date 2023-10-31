import React, { memo } from 'react'
import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import GovernanceScreen from './GovernanceScreen'
import VotingPowerScreen from './VotingPowerScreen'
import ProposalScreen from './ProposalScreen'

const GovernanceStack = createStackNavigator()
const screenOptions: StackNavigationOptions = {
  headerShown: false,
}

const GovernanceStackScreen = () => {
  return (
    <GovernanceStack.Navigator screenOptions={screenOptions}>
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
  )
}

export default memo(GovernanceStackScreen)
