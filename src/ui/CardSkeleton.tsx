import { FADE_IN, FADE_OUT } from '@theme/motion'
import React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Spinner } from './Spinner'

export type CardSkeletonProps = { height: number }

// A loading placeholder the size of a card, with a centred spinner.
export const CardSkeleton = ({ height }: CardSkeletonProps) => (
  <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
    <View
      style={{ height }}
      className="mb-4 w-full items-center justify-center rounded-[12px] bg-secondary"
    >
      <Spinner />
    </View>
  </Animated.View>
)
