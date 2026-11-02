import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { ScrollView } from 'react-native'
import GovernanceWrapper from './GovernanceWrapper'
import { ProposalsList } from './ProposalsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceNavigationProp } from './governanceTypes'

export const ProposalsScreen = () => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const selectedTab = 'proposals'

  return (
    <GovernanceWrapper selectedTab={selectedTab}>
      <VotingPowerCard
        onPress={async (m) =>
          navigation.push('PositionsScreen', {
            mint: m.toBase58(),
          })
        }
      />
      <ScrollView>
        <ProposalsList />
        <TabSafeAreaView edges={['bottom']} />
      </ScrollView>
    </GovernanceWrapper>
  )
}

export default ProposalsScreen
