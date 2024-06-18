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
  AssignProxyScreen: { position?: string; mint: string; wallet?: string }
  RevokeProxyScreen: { position?: string; mint: string; wallet?: string }
}

export type GovernanceNavigationProp =
  StackNavigationProp<GovernanceStackParamList>

const voteAccentColors = [] as Color[]

export default voteAccentColors
export const VotingResultColors: Color[] = [
  'blueRibbon',
  'aquaMarine',
  'purple500',
  'blueBright500',
  'greenBright500',
  'orange500',
  'persianRose',
  'gold',
  'electricViolet',
  'flamenco',
  'malachite',
  'turquoise',
  'white',
  'red500',
]
