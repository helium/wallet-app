import { IdlAccounts } from '@coral-xyz/anchor'
import { Proposal } from '@helium/modular-governance-idls/lib/types/proposal'
import { StackNavigationProp } from '@react-navigation/stack'
import { Color } from '@theme/theme'

export type ProposalV0 = IdlAccounts<Proposal>['proposalV0']
export type VoteChoice = IdlAccounts<Proposal>['proposalV0']['choices'][0]
export type VoteChoiceWithMeta = VoteChoice & {
  index: number
  percent: number
}
export type ProposalFilter =
  | 'all'
  | 'active'
  | 'cancelled'
  | 'passed'
  | 'failed'

export type GovernanceStackParamList = {
  GovernanceScreen: undefined
  VotingPowerScreen: undefined
  ProposalScreen: { proposal: string }
}

export type GovernanceNavigationProp =
  StackNavigationProp<GovernanceStackParamList>

export const VotingResultColors: Color[] = [
  'turquoise',
  'orange500',
  'jazzberryJam',
  'purple500',
  'purpleHeart',
]
