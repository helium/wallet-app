import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import globalStyles from '@theme/globalStyles'
import React, { useMemo, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'
import { VotingPowerCard } from './VotingPowerCard'
import { ProposalsList } from './ProposalsList'
import { GovernanceNavigationProp } from './governanceTypes'

const GovMints = [HNT_MINT, MOBILE_MINT, IOT_MINT]
export const GovernanceScreen = () => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const [selectedMint, setSelectedMint] = useState(HNT_MINT)
  const [govState] = useState({
    proposals: ['1', '2', '3', '4', '5', '6', '7', '8'],
  })

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <Text marginTop="m" alignSelf="center" variant="h4">
          Governance
        </Text>
        <Box flexDirection="row" justifyContent="space-between" marginTop="l">
          {GovMints.map((mint) => (
            <TokenPill
              key={mint.toBase58()}
              mint={mint}
              isActive={selectedMint.equals(mint)}
              onPress={() => setSelectedMint(mint)}
              activeColor="secondaryBackground"
            />
          ))}
        </Box>
        <VotingPowerCard
          marginTop="l"
          mint={selectedMint}
          onPress={async (mint) => {
            navigation.push('VotingPowerScreen', {
              mint: mint.toBase58(),
            })
          }}
        />
        <ProposalsList proposals={govState.proposals} />
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default GovernanceScreen
