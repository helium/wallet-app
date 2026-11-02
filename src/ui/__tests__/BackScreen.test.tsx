import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BackScreen } from '../BackScreen'

const mockGoBack = jest.fn()

// The node test runner cannot load react-native, safe-area or uniwind. The
// host components render as named elements so the test reads their props.
jest.mock('../TabSafeAreaView', () => ({
  TabSafeAreaView: 'TabSafeAreaView',
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))
jest.mock('../Text', () => ({ Text: 'Text' }))
jest.mock('../BackButton', () => ({ BackButton: 'BackButton' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const create = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

const byType = (renderer: TestRenderer.ReactTestRenderer, type: string) =>
  renderer.root.findAllByType(type as unknown as React.ElementType)

describe('BackScreen', () => {
  it('renders the title, the children and the safe-area edges', () => {
    const renderer = create(
      <BackScreen title="Proxy" edges={['top']}>
        <View testID="child" />
      </BackScreen>,
    )

    expect(byType(renderer, 'TabSafeAreaView')[0].props.edges).toEqual(['top'])
    expect(byType(renderer, 'Text')[0].props.children).toBe('Proxy')
    expect(renderer.root.findByProps({ testID: 'child' })).toBeTruthy()
  })

  // Native tabs draw the screen under the tab bar; only the screen's own
  // safe area lifts the content above it.
  it('lifts the content above the tab bar on the bottom edge', () => {
    const [safeArea] = byType(
      create(<BackScreen edges={['bottom']} />),
      'TabSafeAreaView',
    )

    expect(safeArea.props.edges).toContain('bottom')
  })

  it('goes back when the back button is pressed', () => {
    const [back] = byType(create(<BackScreen />), 'BackButton')

    act(() => {
      back.props.onPress()
    })

    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('merges the content and header classNames over the defaults', () => {
    const renderer = create(
      <BackScreen className="p-0" headerClassName="mt-6" />,
    )
    const views = byType(renderer, 'View')
    const header = views[0]
    const content = views[views.length - 1]

    expect(header.props.className).toContain('mt-6')
    expect(content.props.className).toContain('p-0')
    expect(content.props.className).not.toContain('p-7')
  })
})

const View = 'View' as unknown as React.ElementType<{ testID: string }>
