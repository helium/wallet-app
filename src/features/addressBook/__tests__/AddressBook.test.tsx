import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AddressBook from '../AddressBook'

// @react-navigation ships ESM only, which this jest config does not
// transform.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: () => {}, goBack: () => {} }),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ Platform: { OS: 'ios' }, View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47 }),
}))
jest.mock('lucide-react-native', () => ({ X: 'X' }))
jest.mock('uniwind', () => ({ withUniwind: (icon: unknown) => icon }))
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../ContactsList', () => 'ContactsList')

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('AddressBook', () => {
  // Home slides the address book up as a full-screen card, so on iOS the
  // header must clear the status bar.
  it('sits below the top inset on iOS', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<AddressBook />)
    })

    const [root] = renderer.root.findAllByType('View' as never)
    expect(root.props.style).toEqual({ paddingTop: 47 })
  })
})
