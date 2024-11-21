import { ReAnimatedBox } from '@components/AnimatedBox'
import SwapNavigator from '@features/swaps/SwapNavigator'
import React from 'react'
import { FadeIn } from 'react-native-reanimated'

const SwapPage = () => {
  return (
    <ReAnimatedBox entering={FadeIn} flex={1}>
      <SwapNavigator />
    </ReAnimatedBox>
  )
}

export default SwapPage
