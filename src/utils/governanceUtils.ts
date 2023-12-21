import {
  ProposalFilter,
  ProposalV0,
} from 'src/features/governance/governanceTypes'

export const getDerivedProposalState = (
  proposal: ProposalV0,
): Omit<ProposalFilter, 'all' | 'unseen'> | undefined => {
  if (proposal?.state && proposal?.choices) {
    const keys = Object.keys(proposal.state)
    if (keys.includes('voting')) return 'active'
    if (keys.includes('cancelled')) return 'cancelled'
    if (keys.includes('resolved') && proposal.state.resolved) {
      if (
        (proposal.state.resolved.choices.length === 1 &&
          proposal.choices[proposal.state.resolved.choices[0]].name.startsWith(
            'Yes',
          )) ||
        proposal.state.resolved.choices.length > 1 ||
        proposal.state.resolved.choices.length === 0
      ) {
        return 'passed'
      }

      if (
        proposal.state.resolved.choices.length === 1 &&
        proposal.choices[proposal.state.resolved.choices[0]].name.startsWith(
          'No',
        )
      ) {
        return 'failed'
      }
    }
  }
}
