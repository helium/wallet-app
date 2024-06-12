import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import React, { memo } from 'react'
import { PortalHost } from '@gorhom/portal'
import { useAppStorage } from '@storage/AppStorageProvider'
import GovernanceTutorialScreen from './GovernanceTutorialScreen'
import ProposalsScreen from './ProposalsScreen'
import ProposalScreen from './ProposalScreen'
import PositionsScreen from './PositionsScreen'
import VotersScreen from './VotersScreen'
import VoterScreen from './VoterScreen'

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
        <GovernanceStack.Screen name="VotersScreen" component={VotersScreen} />
        <GovernanceStack.Screen
          name="ProposalScreen"
          component={ProposalScreen}
        />
        <GovernanceStack.Screen name="VoterScreen" component={VoterScreen} />
      </GovernanceStack.Navigator>
      <PortalHost name="GovernancePortalHost" />
    </>
  )
}

export default memo(GovernanceStackScreen)
