import { IdlAccounts } from '@anchor-lang/core'
import { Proposal } from '@helium/modular-governance-idls/lib/types/proposal'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type ProposalV0 = IdlAccounts<Proposal>['proposalV0']
export type VoteChoice = IdlAccounts<Proposal>['proposalV0']['choices'][0]
export type VoteChoiceWithMeta = VoteChoice & {
  index: number
  percent: number
}

export type ProposalFilter =
  'all' | 'active' | 'cancelled' | 'passed' | 'failed' | 'unseen'

export type GovernanceStackParamList = {
  GovernanceTutorialScreen: undefined
  ProposalsScreen: { mint?: string; proposal?: string }
  PositionsScreen: { mint: string }
  ProxiesScreen: { mint?: string }
  ProposalScreen: { mint: string; proposal: string }
  ProxyScreen: { mint: string; wallet: string }
  AssignProxyScreen: {
    mint: string
    position?: string
    wallet?: string
    includeProxied?: boolean
  }
  RevokeProxyScreen: { mint: string; position?: string; wallet?: string }
}

export type GovernanceNavigationProp =
  NativeStackNavigationProp<GovernanceStackParamList>

export const VotingResultColors = [
  '#484CF6',
  '#69DBB3',
  '#B556FF',
  '#009FF9',
  '#27EE76',
  '#f97316',
  '#FF2DB7',
  '#FFD700',
  '#DD0FFF',
  '#FF800B',
  '#14D111',
  '#2BD7E2',
  '#FFFFFF',
  '#E43B70',
]
