import React from 'react'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'
import CircleLoader from './CircleLoader'

export const CardSkeleton: React.FC<{ height: number }> = ({ height }) => {
  return (
    <ReAnimatedBox entering={FADE_IN} exiting={FADE_OUT}>
      <Box
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        height={height}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="m"
      >
        <CircleLoader loaderSize={30} />
      </Box>
    </ReAnimatedBox>
  )
}
