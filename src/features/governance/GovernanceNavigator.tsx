import { PortalHost } from '@gorhom/portal'
import {
  StackNavigationOptions,
  createStackNavigator,
} from '@react-navigation/stack'
import { useAppStorage } from '@config/storage/AppStorageProvider'
import React, { memo, useMemo } from 'react'
import { useColors } from '@config/theme/themeHooks'
import AssignProxyScreen from './AssignProxyScreen'
import GovernanceTutorialScreen from './GovernanceTutorialScreen'
import PositionsScreen from './PositionsScreen'
import ProposalScreen from './ProposalScreen'
import ProposalsScreen from './ProposalsScreen'
import RevokeProxyScreen from './RevokeProxyScreen'
import VoterScreen from './VoterScreen'
import VotersScreen from './VotersScreen'

const GovernanceStack = createStackNavigator()
const GovernanceStackScreen = () => {
  const colors = useColors()
  const { voteTutorialShown } = useAppStorage()

  const screenOptions: StackNavigationOptions = useMemo(
    () => ({
      headerShown: false,
      animationEnabled: false,
      cardStyle: { backgroundColor: colors.primaryBackground },
    }),
    [colors],
  )

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
