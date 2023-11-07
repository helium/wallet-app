import { IdlAccounts } from '@coral-xyz/anchor'
import { StackNavigationProp } from '@react-navigation/stack'
import { Proposal } from '@helium/modular-governance-idls/lib/types/proposal'

export type ProposalV0 = IdlAccounts<Proposal>['proposalV0']
export type ProposalFilter =
  | 'all'
  | 'active'
  | 'cancelled'
  | 'passed'
  | 'failed'

export type GovernanceStackParamList = {
  GovernanceScreen: undefined
  VotingPowerScreen: { mint: string }
  ProposalScreen: { proposal: string }
}

export type GovernanceNavigationProp =
  StackNavigationProp<GovernanceStackParamList>
