import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { GlobalError } from '../GlobalError'

const mockCopyText = jest.fn()

jest.mock('@hooks/useCopyText', () => () => mockCopyText, { virtual: true })
jest.mock('@hooks/useHaptic', () => () => ({ triggerImpact: jest.fn() }), {
  virtual: true,
})
jest.mock('@theme/motion', () => ({ useReducedMotion: () => false }), {
  virtual: true,
})
jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// The node test runner cannot load react-native, Reanimated, safe-area,
// uniwind or lucide. The host components render as named elements so the
// test reads their props. The real Button, PressableScale and Text render
// on top of them; the token module only needs the easing factories.
jest.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}))
jest.mock('react-native-reanimated', () => {
  const builder = () => ({
    duration: () => ({ reduceMotion: () => ({}) }),
  })
  return {
    __esModule: true,
    default: { createAnimatedComponent: (component: unknown) => component },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    Easing: { bezier: () => ({}) },
    cubicBezier: () => ({}),
    FadeIn: builder(),
    FadeOut: builder(),
    useReducedMotion: () => false,
  }
})
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Copy: 'Copy' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const error = new Error('boom')
error.stack = 'at crash.ts:1'

const render = (resetErrorBoundary = jest.fn()) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <GlobalError error={error} resetErrorBoundary={resetErrorBoundary} />,
    )
  })
  return renderer
}

const texts = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType('Text' as unknown as React.ElementType)
    .map((node) => node.props.children)

const buttons = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType('Pressable' as unknown as React.ElementType)

describe('GlobalError', () => {
  beforeEach(() => mockCopyText.mockClear())

  it('renders the message, the stack and both buttons', () => {
    const renderer = render()

    expect(texts(renderer)).toEqual([
      'crash.title',
      'crash.subTitle',
      'boom',
      'at crash.ts:1',
      'generic.copyToClipboard',
      'crash.resetApp',
    ])
    expect(buttons(renderer)).toHaveLength(2)
  })

  it('resets the error boundary when reset is pressed', () => {
    const reset = jest.fn()
    const [, resetButton] = buttons(render(reset))

    act(() => {
      resetButton.props.onPress()
    })

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('copies the message and the stack when copy is pressed', () => {
    const [copyButton] = buttons(render())

    act(() => {
      copyButton.props.onPress()
    })

    expect(mockCopyText).toHaveBeenCalledWith({
      message: 'generic.toClipboard',
      copyText: 'boom\nat crash.ts:1',
    })
  })
})
