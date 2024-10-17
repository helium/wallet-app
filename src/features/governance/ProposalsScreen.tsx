import { useNavigation } from '@react-navigation/native'
import React from 'react'
import ScrollBox from '@components/ScrollBox'
import GovernanceWrapper from './GovernanceWrapper'
import { ProposalsList } from './ProposalsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceNavigationProp } from './governanceTypes'

export const ProposalsScreen = () => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const selectedTab = 'proposals'

  return (
    <ScrollBox>
      <GovernanceWrapper selectedTab={selectedTab}>
        <VotingPowerCard
          onPress={async (m) =>
            navigation.push('PositionsScreen', {
              mint: m.toBase58(),
            })
          }
        />
        <ProposalsList />
      </GovernanceWrapper>
    </ScrollBox>
  )
}

export default ProposalsScreen
