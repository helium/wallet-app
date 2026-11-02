import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import NftListItem from '../NftListItem'
import { Collectable } from '../../../types/solana'

const mockNavigate = jest.fn()

// The node test runner cannot load react-native or expo-image. The host
// components render as named elements so the test reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('@react-navigation/native', () => {
  const navigation = {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }
  return { useNavigation: () => navigation }
})
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../../../utils/layout', () => ({ useCollectableHeight: () => 180 }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const collectables = [
  { id: 'nft1', json: { image: 'one.png' } },
  { id: 'nft2', json: { image: 'two.png' } },
] as unknown as Collectable[]

describe('NftListItem', () => {
  it('keys the recycled image to the first collectable and covers a fixed-height tile', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <NftListItem item="Cats" collectables={collectables} />,
      )
    })
    const image = renderer.root.findByType('Image' as never)

    expect(image.props.recyclingKey).toBe('nft1')
    expect(image.props.contentFit).toBe('cover')
    expect(image.props.source).toEqual({ uri: 'one.png' })
    expect(image.props.style).toEqual({ height: 180 })
  })
})
