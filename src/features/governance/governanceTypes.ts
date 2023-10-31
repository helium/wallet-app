import { StackNavigationProp } from '@react-navigation/stack'

export type GovernanceStackParamList = {
  GovernanceScreen: undefined
  VotingPowerScreen: { mint: string }
  ProposalScreen: { proposal: string }
}

export type GovernanceNavigationProp =
  StackNavigationProp<GovernanceStackParamList>
