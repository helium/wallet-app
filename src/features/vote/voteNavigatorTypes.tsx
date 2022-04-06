import { StackNavigationProp } from '@react-navigation/stack'
import { Vote, VoteOutcome, VoteResult } from '../../generated/graphql'
import { CSAccount } from '../../storage/cloudStorage'

export type VoteNavigatorStackParamList = {
  VoteTutorial: undefined
  VoteList: undefined
  VoteShow: {
    vote: Vote
    voteResult?: VoteResult
  }
  VoteBurn: {
    voteOutcome: VoteOutcome
    account: CSAccount
    memo: string
  }
}

export type VoteNavigatorNavigationProp =
  StackNavigationProp<VoteNavigatorStackParamList>
