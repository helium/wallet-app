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
  | 'unseen'

export type GovernanceStackParamList = {
  GovernanceTutorialScreen: undefined
  ProposalsScreen: { mint?: string; proposal?: string }
  PositionsScreen: { mint: string }
  VotersScreen: { mint?: string }
  ProposalScreen: { mint: string; proposal: string }
  VoterScreen: { mint: string; wallet: string }
  AssignProxyScreen: { mint: string; position?: string; wallet?: string }
  RevokeProxyScreen: { mint: string; position?: string; wallet?: string }
}

export type GovernanceNavigationProp =
  StackNavigationProp<GovernanceStackParamList>

const voteAccentColors = [] as Color[]

export default voteAccentColors
export const VotingResultColors: Color[] = [
  'success.500',
  'error.500',
  'purple.500',
  'blue.light-500',
  'green.light-500',
  'orange.500',
  'pink.500',
  'yellow.500',
  'fuchsia.500',
  'orange.dark-500',
  'green.500',
  'cyan.500',
  'base.white',
  'fuchsia.500',
]
