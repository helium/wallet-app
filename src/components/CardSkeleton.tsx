import React from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'
import CircleLoader from './CircleLoader'

export const CardSkeleton: React.FC<{ height: number }> = ({ height }) => {
  return (
    <ReAnimatedBox entering={FadeIn} exiting={FadeOut}>
      <Box
        backgroundColor="bg.tertiary"
        borderRadius="2xl"
        height={height}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="4"
      >
        <CircleLoader loaderSize={30} />
      </Box>
    </ReAnimatedBox>
  )
}
