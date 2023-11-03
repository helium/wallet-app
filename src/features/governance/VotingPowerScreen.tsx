import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useRoute } from '@react-navigation/native'
import globalStyles from '@theme/globalStyles'
import React, { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { Keypair } from '@solana/web3.js'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceStackParamList } from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'VotingPowerScreen'>
export const VotingPowerScreen = () => {
  const route = useRoute<Route>()
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const { mint } = route.params
  const mintKey = usePublicKey(mint)
  const [positions] = useState([
    {
      pubkey: Keypair.generate().publicKey,
      isDelegated: true,
      votingMint: mintKey,
      hasGenesisMultiplier: true,
    },
    {
      pubkey: Keypair.generate().publicKey,
      isDelegated: false,
      votingMint: mintKey,
      hasGenesisMultiplier: false,
    },
  ])

  if (!mintKey) return null

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title="Your Voting Power"
        edges={backEdges}
      >
        <ScrollView>
          <VotingPowerCard mint={mintKey} marginTop="l" />
          <PositionsList positions={positions} />
        </ScrollView>
      </BackScreen>
      <Box flexDirection="row" paddingTop="m">
        <ButtonPressable
          height={50}
          flex={1}
          fontSize={16}
          borderRadius="round"
          borderWidth={2}
          borderColor="white"
          backgroundColorOpacityPressed={0.7}
          title="Lock Tokens"
          titleColor="white"
          titleColorPressed="black"
        />
        <Box paddingHorizontal="s" />
        <ButtonPressable
          height={50}
          flex={1}
          fontSize={16}
          borderRadius="round"
          borderWidth={2}
          borderColor="white"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          title="Claim Rewards"
          titleColor="black"
        />
      </Box>
    </ReAnimatedBox>
  )
}

export default VotingPowerScreen
