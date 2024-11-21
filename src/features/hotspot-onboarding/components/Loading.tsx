import React from 'react'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'

const Loading = () => {
  return (
    <ReAnimatedBox
      entering={FadeIn}
      exiting={FadeOut}
      flexDirection="row"
      justifyContent="flex-end"
      paddingBottom="4xl"
      paddingHorizontal="2xl"
      position="absolute"
      bottom={0}
      right={0}
    >
      <Box
        height={62}
        width={62}
        justifyContent="center"
        alignItems="center"
        backgroundColor="primaryText"
        borderRadius="full"
      >
        <CircleLoader loaderSize={26.08} color="primaryBackground" />
      </Box>
    </ReAnimatedBox>
  )
}

export default Loading
