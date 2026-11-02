import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { CollectablePreview } from '../CollectablePreview'
import { Collectable } from '../../types/solana'

// The node test runner cannot load react-native or expo-image. The host
// components render as named elements so the test reads their props. RN Image
// has its own name, so a render through it does not count as the app Image.
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('react-native', () => ({ View: 'View', Image: 'RNImage' }))
jest.mock('@ui/Card', () => ({ Card: 'Card' }), { virtual: true })
jest.mock('@ui/Pill', () => ({ Pill: 'Pill' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@utils/accountUtils',
  () => ({ ellipsizeAddress: (address: string) => address }),
  { virtual: true },
)
jest.mock('lucide-react-native', () => ({ ArrowUpRight: 'ArrowUpRight' }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const collectable = {
  metadata: { name: 'Hotspot', image: 'https://x/nft.png' },
} as unknown as Collectable

describe('CollectablePreview', () => {
  it('shows the collectable image through the app Image', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <CollectablePreview collectable={collectable} payee="payee1" />,
      )
    })

    const image = renderer.root.findByType('Image' as never)
    expect(image.props.source).toEqual({ uri: 'https://x/nft.png' })
    expect(image.props.className).toBe('size-10 rounded-md bg-primary')
  })
})
