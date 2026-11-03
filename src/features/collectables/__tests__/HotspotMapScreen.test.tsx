import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { HotspotWithPendingRewards } from '../../../types/solana'
import HotspotMapScreen from '../HotspotMapScreen'

// The route params, as the navigator holds them for the open screen.
let mockParams:
  | { hotspot?: HotspotWithPendingRewards; network?: 'IOT' | 'MOBILE' }
  | undefined
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: mockParams }),
  useNavigation: () => ({ goBack: () => {} }),
}))
// No hotspot has map info, so the screen shows the route's hotspot alone.
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false }),
}))
jest.mock(
  '@hooks/useHotspots',
  () => () => ({
    hotspots: [],
    fetchAll: () => {},
    loading: false,
    onEndReached: true,
  }),
  { virtual: true },
)
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: {} }),
}))
jest.mock('../hotspotMapInfosQuery', () => ({
  hotspotMapInfosQuery: () => ({}),
}))
jest.mock('../HotspotMapHotspotDetails', () => ({
  HotspotMapHotspotDetails: 'HotspotMapHotspotDetails',
}))
jest.mock('../HotspotMapLegend', () => ({
  HotspotMapLegend: 'HotspotMapLegend',
}))
jest.mock('../map/Map', () => 'Map')
jest.mock('../map/utils', () => ({
  INITIAL_MAP_VIEW_STATE: { zoomLevel: 10, centerCoordinate: [0, 0] },
  MAX_MAP_ZOOM: 20,
}))
jest.mock('@maplibre/maplibre-react-native', () => ({
  useCurrentPosition: () => undefined,
  Images: 'Images',
  GeoJSONSource: 'GeoJSONSource',
  Layer: 'Layer',
}))
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: 'BottomSheetModal',
  BottomSheetModalProvider: 'BottomSheetModalProvider',
  BottomSheetScrollView: 'BottomSheetScrollView',
}))
jest.mock('@assets/images/hex.svg', () => 'HexArt', { virtual: true })
jest.mock('@assets/images/mapIotHex.png', () => 1, { virtual: true })
jest.mock('@assets/images/mapIotHexActive.png', () => 1, { virtual: true })
jest.mock('@assets/images/mapMobileHex.png', () => 1, { virtual: true })
jest.mock('@assets/images/mapMobileHexActive.png', () => 1, { virtual: true })
jest.mock('@theme/motion', () => ({ FADE_OUT_STATE: undefined }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Sheet', () => ({ SheetBackground: 'SB', SheetHandle: 'SH' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@utils/h3', () => ({ parseH3BNLocation: () => [0, 0] }), {
  virtual: true,
})
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  CircleHelp: 'CircleHelp',
  LocateFixed: 'LocateFixed',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ Alert: { alert: () => {} }, View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (c: unknown) => c },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
jest.mock('use-debounce', () => ({ useDebounce: (value: unknown) => [value] }))
jest.mock('uniwind', () => ({
  withUniwind: (c: unknown) => c,
  useCSSVariable: () => ['blue', 'green'],
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const hotspotWithId = (id: string) =>
  ({ id }) as unknown as HotspotWithPendingRewards

const renderScreen = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<HotspotMapScreen />)
  })
  return renderer
}
const shownHotspots = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType('HotspotMapHotspotDetails' as never)
    .map((n) => ({ id: n.props.hotspot.id, network: n.props.network }))
const switchNetwork = (renderer: TestRenderer.ReactTestRenderer) =>
  act(() => {
    renderer.root
      .find(
        (n) =>
          (n.type as unknown) === 'PressableScale' &&
          n.findAll(
            (c) => c.props.children === 'collectablesScreen.hotspots.map.type',
          ).length > 0,
      )
      .props.onPress()
  })
const navigateTo = (
  renderer: TestRenderer.ReactTestRenderer,
  params: typeof mockParams,
) => {
  mockParams = params
  act(() => {
    renderer.update(<HotspotMapScreen />)
  })
}

describe('HotspotMapScreen', () => {
  it('shows the hotspot and network of new route params', () => {
    mockParams = { hotspot: hotspotWithId('h1') }
    const renderer = renderScreen()
    expect(shownHotspots(renderer)).toEqual([{ id: 'h1', network: 'IOT' }])

    // The hotspot list opens the same screen with a mobile hotspot.
    navigateTo(renderer, { hotspot: hotspotWithId('h2'), network: 'MOBILE' })

    expect(shownHotspots(renderer)).toEqual([{ id: 'h2', network: 'MOBILE' }])
  })

  it('shows the hotspot of new route params after a network switch', () => {
    mockParams = { hotspot: hotspotWithId('h1') }
    const renderer = renderScreen()
    switchNetwork(renderer)
    expect(shownHotspots(renderer)).toEqual([])

    navigateTo(renderer, { hotspot: hotspotWithId('h3') })

    expect(shownHotspots(renderer)).toEqual([{ id: 'h3', network: 'IOT' }])
  })
})
