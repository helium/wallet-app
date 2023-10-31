import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import globalStyles from '@theme/globalStyles'
import React, { useMemo } from 'react'
import { Edge } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native'
import { VotingPowerCard } from '@components/VotingPowerCard'
import { PositionCard } from '@components/PositionCard'

export const VotingPowerScreen = () => {
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title="Your Voting Power"
        edges={backEdges}
      >
        <ScrollView>
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="m"
          >
            <VotingPowerCard />
            <PositionCard />
          </SafeAreaBox>
        </ScrollView>
      </BackScreen>
    </ReAnimatedBox>
  )
}
