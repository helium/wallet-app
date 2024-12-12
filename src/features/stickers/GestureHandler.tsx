import React from 'react'
import {
  Skia,
  type SkMatrix,
  type SkSize,
  vec,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import { rotateZ, scale, toM4, translate } from './MatrixHelpers'

interface GestureHandlerProps {
  matrix: SharedValue<SkMatrix>
  size: SkSize
  dragged: SharedValue<boolean>
}

export const GestureHandler = ({
  matrix,
  size,
  dragged,
}: GestureHandlerProps) => {
  const pivot = useSharedValue(Skia.Point(0, 0))
  const offset = useSharedValue(Skia.Matrix())
  const pan = Gesture.Pan().onChange((event) => {
    // eslint-disable-next-line no-param-reassign
    matrix.value = translate(matrix.value, event.changeX, event.changeY)
  })
  const pinch = Gesture.Pinch()
    .onBegin((event) => {
      offset.value = matrix.value
      pivot.value = vec(event.focalX, event.focalY)
      // eslint-disable-next-line no-param-reassign
      dragged.value = true
    })
    .onChange((event) => {
      // eslint-disable-next-line no-param-reassign
      matrix.value = scale(offset.value, event.scale, pivot.value)
      // eslint-disable-next-line no-param-reassign
      dragged.value = false
    })

  const rotate = Gesture.Rotation()
    .onBegin((event) => {
      offset.value = matrix.value
      pivot.value = vec(event.anchorX, event.anchorY)
      // eslint-disable-next-line no-param-reassign
      dragged.value = true
    })
    .onChange((event) => {
      // eslint-disable-next-line no-param-reassign
      matrix.value = rotateZ(offset.value, event.rotation, pivot.value)
      // eslint-disable-next-line no-param-reassign
      dragged.value = false
    })
  const gesture = Gesture.Race(pan, pinch, rotate)
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size.width,
    height: size.height,
    top: 0,
    left: 0,
    transform: [
      {
        translateX: -size.width / 2,
      },
      {
        translateY: -size.height / 2,
      },
      { matrix: toM4(matrix?.value) },
      {
        translateX: size.width / 2,
      },
      {
        translateY: size.height / 2,
      },
    ],
  }))
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style} />
    </GestureDetector>
  )
}
