import React from 'react'
import { Pressable } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'
import IconPressedContainer from '../IconPressedContainer'

const mockTriggerImpact = jest.fn()

jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerImpact: mockTriggerImpact }),
  {
    virtual: true,
  },
)

// The node test runner cannot load react-native or Reanimated. Pressable and
// the animated box only need to pass their props through.
jest.mock('react-native', () => ({
  Pressable: () => null,
  StyleSheet: { create: <T>(styles: T) => styles },
}))
jest.mock('react-native-reanimated', () => ({
  Reanimated3DefaultSpringConfig: {},
  useAnimatedStyle: () => ({}),
  withSpring: (value: number) => value,
}))
jest.mock('../AnimatedBox', () => ({ ReAnimatedBox: () => null }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const press = (onPress: () => void) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(IconPressedContainer, { onPress }),
    )
  })
  const pressable = renderer?.root.findByType(Pressable)
  act(() => {
    pressable?.props.onPress({})
  })
}

describe('IconPressedContainer', () => {
  beforeEach(() => mockTriggerImpact.mockClear())

  it('fires one haptic and calls onPress once per press', () => {
    const onPress = jest.fn()

    press(onPress)

    expect(mockTriggerImpact).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
