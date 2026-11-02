import React from 'react'
import { View } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'
import OnboardingScreen from '../components/OnboardingScreen'

const mockGoBack = jest.fn<void, []>()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
// The identity t lets the test find the back button by its key.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ChevronLeft: 'ChevronLeft' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('OnboardingScreen', () => {
  it('renders the title and the child, and the back button goes back', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    await act(async () => {
      renderer = TestRenderer.create(
        <OnboardingScreen title="Scan">
          <View testID="child" />
        </OnboardingScreen>,
      )
    })
    if (!renderer) throw new Error('render failed')

    const texts = renderer.root
      .findAllByType('Text' as never)
      .map((n) => n.props.children)
    expect(texts).toContain('Scan')
    expect(renderer.root.findByProps({ testID: 'child' })).toBeTruthy()

    const back = renderer.root
      .findAllByType('PressableScale' as never)
      .find((n) => n.props.accessibilityLabel === 'generic.back')
    if (!back) throw new Error('back button not rendered')
    act(() => {
      back.props.onPress()
    })

    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })
})
