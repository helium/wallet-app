import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import globalStyles from '@theme/globalStyles'
import React, { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'

export const ProposalScreen = () => {
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <ScrollView>
        <BackScreen
          headerTopMargin="l"
          padding="none"
          title="Proposal"
          edges={backEdges}
        >
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="m"
          >
            <Text>ProposalScreen</Text>
          </SafeAreaBox>
        </BackScreen>
      </ScrollView>
      <Box flexDirection="row" paddingTop="m">
        <ButtonPressable
          height={50}
          flex={1}
          fontSize={16}
          borderRadius="round"
          borderWidth={2}
          borderColor="white"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          title="Cast Vote"
          titleColor="black"
        />
      </Box>
    </ReAnimatedBox>
  )
}

export default ProposalScreen
