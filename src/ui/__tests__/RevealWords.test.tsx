import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { RevealWords } from '../RevealWords'

const mockCopyText = jest.fn()
const mockUseSecureWindow = jest.fn()

const mockUseCopyText = jest.fn()

jest.mock('../TabSafeAreaView', () => ({
  TabSafeAreaView: 'TabSafeAreaView',
}))
jest.mock(
  '@hooks/useCopyText',
  () => (options: unknown) => {
    mockUseCopyText(options)
    return mockCopyText
  },
  { virtual: true },
)
jest.mock('@hooks/useSecureWindow', () => () => mockUseSecureWindow(), {
  virtual: true,
})
jest.mock('@theme/motion', () => ({ DUR: { enter: 200 } }), { virtual: true })
jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('../Button', () => ({ Button: 'Button' }))
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
// The node test runner cannot load react-native. The list renders every row
// and its footer.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    View: 'View',
    Text: 'Text',
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    FlatList: ({
      data,
      renderItem,
      keyExtractor,
      ListFooterComponent,
    }: {
      data: string[]
      renderItem: (info: { item: string; index: number }) => React.ReactNode
      keyExtractor?: (item: string, index: number) => string
      ListFooterComponent: React.ReactNode
    }) =>
      ReactActual.createElement(
        'FlatList',
        { keyExtractor },
        data.map((item, index) =>
          ReactActual.createElement(
            ReactActual.Fragment,
            { key: item },
            renderItem({ item, index }),
          ),
        ),
        ListFooterComponent,
      ),
  }
})
jest.mock('react-native-reanimated', () => {
  const chain = { delay: () => chain, reduceMotion: () => chain }
  return {
    __esModule: true,
    default: { View: 'Animated.View' },
    FadeIn: { duration: () => chain },
    ReduceMotion: { Never: 'never' },
  }
})
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Copy: 'Copy' }))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('RevealWords', () => {
  it('numbers the words in upper case and copies them on request', () => {
    const onDone = jest.fn()
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <RevealWords
          mnemonic={['apple', 'banana', 'cherry']}
          onDone={onDone}
        />,
      )
    })
    const { root } = renderer

    // Maestro reads the words by these IDs.
    const word = (i: number) =>
      root.find((n) => n.props.testID === `RevealWords.Word.${i}`).props
        .children
    expect(word(0)).toBe('APPLE')
    expect(word(1)).toBe('BANANA')
    expect(word(2)).toBe('CHERRY')
    const texts = root
      .findAllByType('Text' as never)
      .map((n) => n.props.children)
    expect(texts.filter((c) => /^\d+\. $/.test(String(c)))).toEqual([
      '1. ',
      '2. ',
      '3. ',
    ])
    expect(mockUseSecureWindow).toHaveBeenCalled()

    act(() => {
      root.findByType('PressableScale' as never).props.onPress()
    })
    // The copy pressable fires its own haptic.
    expect(mockUseCopyText).toHaveBeenCalledWith({ haptic: false })
    expect(mockCopyText).toHaveBeenCalledWith({
      message: 'generic.seedPhrase',
      copyText: 'apple banana cherry',
    })

    const next = root.findByType('Button' as never)
    expect(next.props.testID).toBe('RevealWords.Next')
    act(() => {
      next.props.onPress()
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('keys each word by its place, so a repeated word keeps its own row', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <RevealWords
          mnemonic={['apple', 'banana', 'cherry']}
          onDone={jest.fn()}
        />,
      )
    })
    const { keyExtractor } = renderer.root.findByType('FlatList' as never)
      .props as { keyExtractor?: (item: string, index: number) => string }

    expect(keyExtractor).toBeDefined()
    expect(keyExtractor?.('apple', 0)).not.toBe(keyExtractor?.('apple', 5))
  })
})
