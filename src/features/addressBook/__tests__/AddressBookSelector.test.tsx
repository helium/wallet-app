import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { NavigationContainer } from '@react-navigation/native'
import AddressBookSelector, { AddressBookRef } from '../AddressBookSelector'

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  const { Portal, PortalProvider } = jest.requireActual('@gorhom/portal')
  const HostName = ReactActual.createContext(undefined)
  let nextId = 0
  const ModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [hostName] = ReactActual.useState(
      () => `bottom-sheet-portal-${(nextId += 1)}`,
    )
    return ReactActual.createElement(
      HostName.Provider,
      { value: hostName },
      ReactActual.createElement(PortalProvider, { rootHostName: hostName }, [
        children,
      ]),
    )
  }
  const BottomSheetModal = ReactActual.forwardRef(
    ({ children }: { children: React.ReactNode }, ref: unknown) => {
      const hostName = ReactActual.useContext(HostName)
      const [mount, setMount] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setMount(true),
        dismiss: () => setMount(false),
      }))
      return mount
        ? ReactActual.createElement(Portal, { hostName }, children)
        : null
    },
  )
  return {
    BottomSheetModalProvider: ModalProvider,
    BottomSheetModal,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
  }
})

// @react-navigation ships ESM only, which this jest config does not
// transform. useNavigation keeps the check of @react-navigation/core
// useNavigation: it throws when no navigator or container is above it.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react')
  const NavigationRef = ReactActual.createContext(undefined)
  const navigation = { navigate: () => {} }
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(
        NavigationRef.Provider,
        { value: navigation },
        children,
      ),
    useNavigation: () => {
      const value = ReactActual.useContext(NavigationRef)
      if (value === undefined) {
        throw new Error(
          "Couldn't find a navigation object. Is your component inside NavigationContainer?",
        )
      }
      return value
    },
  }
})

// Stands in for sheet content that reads the screen's context, as a contact
// row does when it navigates.
jest.mock('../ContactsList', () => {
  const { useNavigation } = jest.requireMock('@react-navigation/native')
  return () => {
    useNavigation()
    return 'ContactsList'
  }
})
jest.mock('../../../navigation/NavigationHelper', () => ({
  navigateToHomeScreen: () => {},
}))
jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('AddressBookSelector', () => {
  it('opens the contacts sheet inside the screen tree', () => {
    const ref = React.createRef<AddressBookRef>()
    // src/App.tsx: the root BottomSheetModalProvider sits outside the
    // NavigationContainer, and the screen renders inside it.
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <BottomSheetModalProvider>
          <NavigationContainer>
            <AddressBookSelector ref={ref} onContactSelected={() => {}}>
              screen
            </AddressBookSelector>
          </NavigationContainer>
        </BottomSheetModalProvider>,
      )
    })
    if (!renderer) throw new Error('render failed')
    expect(JSON.stringify(renderer.toJSON())).not.toContain('ContactsList')

    act(() => {
      ref.current?.showAddressBook({})
    })

    expect(JSON.stringify(renderer.toJSON())).toContain('ContactsList')
  })
})
