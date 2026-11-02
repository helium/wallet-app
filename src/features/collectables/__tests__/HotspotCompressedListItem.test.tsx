import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import HotspotCompressedListItem from '../HotspotCompressedListItem'
import { HotspotWithPendingRewards } from '../../../types/solana'

// A list row must not fetch: each hook of this module throws if the row
// calls it. The list reads the reward mints once for all rows.
function mockThrows(name: string) {
  return () => {
    throw new Error(`a hotspot row called ${name}`)
  }
}

jest.mock('@helium/helium-react-hooks', () => ({
  useMint: mockThrows('useMint'),
}))
jest.mock('@helium/spl-utils', () => ({
  HNT_MINT: 'hnt-mint',
  IOT_MINT: 'iot-mint',
  MOBILE_MINT: 'mobile-mint',
  toNumber: (amount: { toNumber: () => number }, decimals: number) =>
    amount.toNumber() / 10 ** decimals,
}))
jest.mock(
  '@hooks/useHotspotAddress',
  () => ({
    useHotspotAddress: (hotspot: HotspotWithPendingRewards) =>
      hotspot.content.metadata?.attributes?.find(
        (attr: { trait_type?: string }) => attr.trait_type === 'iot_city',
      )?.value,
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useCurrentWallet',
  () => ({ useCurrentWallet: () => undefined }),
  { virtual: true },
)
jest.mock(
  '@utils/accountUtils',
  () => ({
    ellipsizeAddress: (address: string) => `${address.slice(0, 3)}...`,
    formatLargeNumber: (num: { toString: () => string }) => num.toString(),
  }),
  { virtual: true },
)
jest.mock('../../../utils/constants', () => ({
  Mints: { IOT: 'iot', MOBILE: 'mobile', HNT: 'hnt' },
}))
jest.mock('@assets/images/iotSymbol.svg', () => 'IotSymbol', {
  virtual: true,
})
jest.mock('@assets/images/mobileSymbol.svg', () => 'MobileSymbol', {
  virtual: true,
})
jest.mock('@assets/images/hnt.svg', () => 'HntSymbol', { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// 1.5 HNT and 2 IOT pending, no MOBILE.
const hotspot = {
  id: 'hotspot-1',
  content: {
    metadata: {
      name: 'happy-blue-cat',
      image: 'cat.png',
      attributes: [
        { trait_type: 'ecc_compact', value: 'abcdef' },
        { trait_type: 'iot_city', value: 'Austin' },
      ],
    },
  },
  pendingRewards: { hnt: '150000000', mobile: '0', iot: '2000000' },
} as unknown as HotspotWithPendingRewards

describe('HotspotCompressedListItem', () => {
  it('renders the pending rewards from plain props and opens the hotspot', () => {
    const onPress = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <HotspotCompressedListItem
          hotspot={hotspot}
          onPress={onPress}
          iotDecimals={6}
          mobileDecimals={6}
          hntDecimals={8}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    expect(
      root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toEqual(['Happy Blue Cat', 'Austin', 'abc...', '1.5', '2'])

    act(() => {
      root.findByType('PressableScale' as never).props.onPress()
    })
    expect(onPress).toHaveBeenCalledWith(hotspot)
  })

  it('keys the recycled image to the hotspot and covers a fixed 62x72 box', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <HotspotCompressedListItem
          hotspot={hotspot}
          onPress={jest.fn()}
          iotDecimals={6}
          mobileDecimals={6}
          hntDecimals={8}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const image = renderer.root.findByType('Image' as never)

    expect(image.props.recyclingKey).toBe('hotspot-1')
    expect(image.props.contentFit).toBe('cover')
    expect(image.props.source).toEqual({ uri: 'cat.png' })
    expect(image.props.className).toContain('h-[72px] w-[62px]')
  })
})
