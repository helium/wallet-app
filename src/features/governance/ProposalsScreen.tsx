/* eslint-disable @typescript-eslint/no-shadow */
import { useNavigation } from '@react-navigation/native'
import React from 'react'
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
      {/*               {numActiveVotes > 0 && (
                <TouchableOpacityBox onPress={() => {}}>
                  <Box
                    flexDirection="row"
                    backgroundColor="secondaryBackground"
                    justifyContent="space-between"
                    alignItems="center"
                    borderRadius="l"
                    padding="m"
                    marginTop="m"
                  >
                    <Box flexDirection="row">
                      <Text
                        variant="body2"
                        color="secondaryText"
                        marginRight="xs"
                      >
                        Relinquish Active Votes:
                      </Text>
                      <Text variant="body2" color="secondaryText">
                        {numActiveVotes}
                      </Text>
                    </Box>
                    <Text variant="body2" color="white" marginRight="xs">
                      &gt;
                    </Text>
                  </Box>
                </TouchableOpacityBox>
              )} */}
      <ScrollView>
        <ProposalsList />
      </ScrollView>
    </GovernanceWrapper>
  )
}

export default ProposalsScreen
