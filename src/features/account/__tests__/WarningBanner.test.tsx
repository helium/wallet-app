import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import WarningBanner, { BannerType } from '../WarningBanner'

let mockShowBanner = true

// The node test runner cannot load react-native, Reanimated, uniwind or
// lucide. Host components render as named elements. Shared values hold what
// was set, and a timing is a plain description of its target.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-reanimated', () => {
  const ReactActual = jest.requireActual('react')
  return {
    __esModule: true,
    default: { View: 'Animated.View' },
    useSharedValue: (initial: unknown) => {
      const [shared] = ReactActual.useState(() => {
        let value = initial
        return {
          get: () => value,
          set: (next: unknown) => {
            value = next
          },
        }
      })
      return shared
    },
    useAnimatedStyle: (style: () => unknown) => style(),
    // Maps a settled number; describes the mapping of an animation.
    interpolate: (value: unknown, input: number[], output: number[]) =>
      typeof value === 'number'
        ? output[0] +
          ((value - input[0]) / (input[1] - input[0])) * (output[1] - output[0])
        : { interpolate: value, input, output },
    withTiming: (toValue: number) => ({ timing: toValue }),
  }
})
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
  return {
    rerender: () =>
      act(() => {
        renderer.update(<WarningBanner type={BannerType.DevnetTokens} />)
      }),
    style: () => renderer.root.findByType('Animated.View' as never).props.style,
  }
}

beforeEach(() => {
  mockShowBanner = true
})

// The banner sits under the status bar inset and slides by transform, so no
// frame of the slide runs layout. Once closed it leaves the layout, so the
// content below takes its place.
describe('WarningBanner', () => {
  it('rests in place below the status bar inset', () => {
    expect(render().style()).toEqual([
      { paddingTop: 20 },
      { transform: [{ translateY: 0 }], display: 'flex' },
    ])
  })

  it('slides up by its 52pt minimum height and the inset when closed', () => {
    const view = render()
    mockShowBanner = false
    view.rerender()
    // The next render reads the timing set by the effect.
    view.rerender()

    expect(view.style()).toEqual([
      { paddingTop: 20 },
      {
        transform: [
          {
            translateY: {
              interpolate: { timing: 0 },
              input: [0, 1],
              output: [-72, 0],
            },
          },
        ],
        display: 'flex',
      },
    ])
  })

  it('takes no layout space when it mounts closed', () => {
    mockShowBanner = false

    expect(render().style()).toEqual([
      { paddingTop: 20 },
      { transform: [{ translateY: -72 }], display: 'none' },
    ])
  })
})
