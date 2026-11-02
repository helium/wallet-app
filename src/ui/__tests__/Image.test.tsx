import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Image } from '../Image'

// The node test runner cannot load expo-image or Uniwind. The native image
// renders as a named element so the test reads its props. Uniwind passes the
// component through; className stays a prop.
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
// A bundled asset's intrinsic size, as Metro's asset registry records it.
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: (id: number) =>
      id === 7 ? { width: 120, height: 48 } : { width: null, height: null },
  },
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const create = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer.root.findByType('ExpoImage' as unknown as React.ElementType)
}

describe('Image', () => {
  it('passes className, recyclingKey and contentFit to expo-image', () => {
    const image = create(
      <Image
        className="size-12 rounded-full"
        recyclingKey="nft1"
        contentFit="cover"
        source={{ uri: 'https://x/a.png' }}
      />,
    )
    expect(image.props.className).toBe('size-12 rounded-full')
    expect(image.props.recyclingKey).toBe('nft1')
    expect(image.props.contentFit).toBe('cover')
    expect(image.props.source).toEqual({ uri: 'https://x/a.png' })
  })

  it('sizes a bundled asset to its intrinsic size, as RN Image did', () => {
    const image = create(<Image source={7} />)
    expect(image.props.style).toEqual([{ width: 120, height: 48 }, undefined])
  })

  it('lets the given style override the intrinsic size', () => {
    const image = create(<Image source={7} style={{ width: 60 }} />)
    expect(image.props.style).toEqual([
      { width: 120, height: 48 },
      { width: 60 },
    ])
  })

  it('adds no size to a remote image', () => {
    const image = create(
      <Image source={{ uri: 'https://x/a.png' }} style={{ height: 180 }} />,
    )
    expect(image.props.style).toEqual({ height: 180 })
  })
})
