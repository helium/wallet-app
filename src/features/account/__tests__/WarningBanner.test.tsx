import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import WarningBanner, { BannerType } from '../WarningBanner'

let mockShowBanner = true

// The node test runner cannot load react-native, Reanimated, uniwind or
// lucide. Host components render as named elements, and a timing is a plain
// description of its target.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
  useAnimatedStyle: (style: () => unknown) => style(),
  withTiming: (toValue: number) => ({ timing: toValue }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  CircleX: 'CircleX',
  TriangleAlert: 'TriangleAlert',
}))
jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: null,
  useSafeAreaInsets: () => ({ top: 20 }),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock(
  '@hooks/useLayoutHeight',
  () => jest.requireActual('../../../hooks/useLayoutHeight'),
  { virtual: true },
)
jest.mock(
  '@hooks/useSolanaHealth',
  () => () => ({ healthMessage: 'unhealthy' }),
  { virtual: true },
)
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../../../store/appStore', () => ({
  useAppStore: (
    select: (state: {
      showBanner: boolean
      setShowBanner: () => void
    }) => unknown,
  ) => select({ showBanner: mockShowBanner, setShowBanner: () => {} }),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <WarningBanner type={BannerType.DevnetTokens} />,
    )
  })
  return renderer.root.findByType('Animated.View' as never).props.style
}

beforeEach(() => {
  mockShowBanner = true
})

// The banner sits under the status bar inset and slides by transform, so no
// frame of the slide runs layout.
describe('WarningBanner', () => {
  it('rests in place below the status bar inset', () => {
    expect(render()).toEqual([
      { paddingTop: 20 },
      { transform: [{ translateY: { timing: 0 } }] },
    ])
  })

  it('slides up by its 52pt minimum height and the inset when closed', () => {
    mockShowBanner = false

    expect(render()).toEqual([
      { paddingTop: 20 },
      { transform: [{ translateY: { timing: -72 } }] },
    ])
  })
})
