import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import HotspotMapScreen from '../HotspotMapScreen'
import { mockMapRef } from './mapLibreMock'

jest.mock('@maplibre/maplibre-react-native', () =>
  jest.requireActual('./mapLibreMock'),
)
// One hex in San Francisco, keyed as the decimal BN string the screen parses.
jest.mock('@tanstack/react-query', () => {
  const { latLngToCell } = jest.requireActual('h3-js')
  const { BN } = jest.requireActual('bn.js')
  const hex = new BN(latLngToCell(37.7749, -122.4194, 8), 16).toString()
  const result = { data: { [hex]: [] }, isLoading: false }
  return { useQuery: () => result }
})
jest.mock('../hotspotMapInfosQuery', () => ({
  hotspotMapInfosQuery: () => ({}),
}))
jest.mock(
  '@hooks/useHotspots',
  () => {
    const hotspots = {
      hotspots: [],
      fetchAll: () => {},
      loading: false,
      onEndReached: true,
    }
    return { __esModule: true, default: () => hotspots }
  },
  { virtual: true },
)
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { anchorProvider: {} }
  return { useSolana: () => solana }
})
jest.mock('@react-navigation/native', () => {
  const navigation = { goBack: jest.fn() }
  const route = { params: {} }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('@utils/h3', () => jest.requireActual('../../../utils/h3'), {
  virtual: true,
})
jest.mock('@utils/config', () => ({ __esModule: true, default: {} }), {
  virtual: true,
})
jest.mock('@theme/motion', () => ({ FADE_OUT_STATE: {} }), { virtual: true })
jest.mock('@assets/images/hex.svg', () => 'Hex', { virtual: true })
jest.mock('@assets/images/mapIotHex.png', () => 1, { virtual: true })
jest.mock('@assets/images/mapIotHexActive.png', () => 2, { virtual: true })
jest.mock('@assets/images/mapMobileHex.png', () => 3, { virtual: true })
jest.mock('@assets/images/mapMobileHexActive.png', () => 4, { virtual: true })
jest.mock('@gorhom/bottom-sheet', () => {
  const { createElement, forwardRef, useImperativeHandle } =
    jest.requireActual('react')
  return {
    BottomSheetModal: forwardRef(
      (props: object, ref: React.Ref<{ present(): void; dismiss(): void }>) => {
        useImperativeHandle(ref, () => ({ present() {}, dismiss() {} }))
        return createElement('BottomSheetModal', props)
      },
    ),
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    BottomSheetScrollView: 'BottomSheetScrollView',
  }
})
jest.mock('../HotspotMapHotspotDetails', () => ({
  HotspotMapHotspotDetails: 'HotspotMapHotspotDetails',
}))
jest.mock('../HotspotMapLegend', () => ({
  HotspotMapLegend: 'HotspotMapLegend',
}))
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock(
  '@ui/Sheet',
  () => ({ SheetBackground: 'SheetBackground', SheetHandle: 'SheetHandle' }),
  { virtual: true },
)
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  CircleHelp: 'CircleHelp',
  LocateFixed: 'LocateFixed',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ Alert: { alert: jest.fn() }, View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (c: unknown) => c },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => {
  const colors = ['#0000ff', '#00ff00']
  return { useCSSVariable: () => colors, withUniwind: (c: unknown) => c }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let created: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    created = TestRenderer.create(<HotspotMapScreen />)
  })
  if (!created) throw new Error('render failed')
  const { root } = created
  const node = (type: string) => root.findByType(type as never)
  return {
    hexData: () => node('GeoJSONSource').props.data,
    // The network toggle is the only PressableScale holding a Hex icon.
    toggleNetwork: () =>
      act(() => {
        root
          .findAllByType('PressableScale' as never)
          .find((p) => p.findAllByType('Hex' as never).length)
          ?.props.onPress()
      }),
    snapSheet: (index: number) =>
      act(() => {
        node('BottomSheetModal').props.onChange(index)
      }),
    // The map reports its zoom when a camera move ends.
    endCameraMoveAt: async (zoom: number) => {
      mockMapRef.getZoom.mockResolvedValue(zoom)
      await act(async () => {
        node('Map').props.onRegionDidChange()
      })
    },
  }
}

describe('HotspotMapScreen hex source', () => {
  it('keeps its data when the bottom sheet snaps', () => {
    const view = render()
    const before = view.hexData()

    view.snapSheet(1)

    expect(view.hexData()).toBe(before)
  })

  // IOT hexes are drawn at one resolution whatever the zoom.
  it('keeps its data across an IOT zoom', async () => {
    const view = render()
    const before = view.hexData()

    await view.endCameraMoveAt(13)

    expect(view.hexData()).toBe(before)
  })

  // MOBILE hexes switch resolution only past zoom 16.
  it('keeps its data across a MOBILE zoom that stays under 16', async () => {
    const view = render()
    view.toggleNetwork()
    const before = view.hexData()

    await view.endCameraMoveAt(14)

    expect(view.hexData()).toBe(before)
  })

  it('redraws MOBILE hexes when a zoom crosses 16', async () => {
    const view = render()
    view.toggleNetwork()
    const before = view.hexData()

    await view.endCameraMoveAt(17)

    expect(view.hexData().features[0].geometry).not.toEqual(
      before.features[0].geometry,
    )
  })
})
