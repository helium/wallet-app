import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { memo } from 'react'
import { GovernanceProvider } from '@storage/GovernanceProvider'
import GovernanceScreen from './GovernanceScreen'
import ProposalScreen from './ProposalScreen'
import VotingPowerScreen from './VotingPowerScreen'

const GovernanceStack = createStackNavigator()
const screenOptions: StackNavigationOptions = {
  headerShown: false,
}

const GovernanceStackScreen = () => {
  return (
    <GovernanceProvider>
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
    </GovernanceProvider>
  )
}

export default memo(GovernanceStackScreen)
