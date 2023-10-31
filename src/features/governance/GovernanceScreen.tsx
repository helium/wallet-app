import { ReAnimatedBox } from '@components/AnimatedBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import globalStyles from '@theme/globalStyles'
import React, { useMemo } from 'react'
import { Edge } from 'react-native-safe-area-context'

export const GovernanceScreen = () => {
  const safeEdges = useMemo(() => ['top'] as Edge[], [])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <Text marginTop="m" alignSelf="center" variant="h4">
          Governance
        </Text>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}
