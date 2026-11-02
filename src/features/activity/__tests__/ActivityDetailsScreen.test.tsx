import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { NavigationContainer } from '@react-navigation/native'
import ActivityDetailsScreen from '../ActivityDetailsScreen'

const FROM = 'from-wallet-address'
const TO = 'to-wallet-address'

const mockCopyText = jest.fn()

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider.
jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
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
    BottomSheetView: 'BottomSheetView',
  }
})

// @react-navigation ships ESM only, which this jest config does not
// transform. useNavigation keeps the check of @react-navigation/core
// useNavigation: it throws when no navigator or container is above it.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react')
  const NavigationRef = ReactActual.createContext(undefined)
  const navigation = { goBack: () => {} }
  const route = {
    params: {
      transaction: {
        signature: 'signature',
        type: 'TRANSFER',
        description: '',
        timestamp: 1700000000,
        tokenTransfers: [{ fromUserAccount: 'from-wallet-address' }],
        nativeTransfers: [{ toUserAccount: 'to-wallet-address' }],
      },
    },
  }
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(
        NavigationRef.Provider,
        { value: navigation },
        children,
      ),
    useNavigation: () => {
      const nav = ReactActual.useContext(NavigationRef)
      if (nav === undefined) {
        throw new Error(
          "Couldn't find a navigation object. Is your component inside NavigationContainer?",
        )
      }
      return nav
    },
    useRoute: () => route,
  }
})

jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })
jest.mock('@hooks/useCopyText', () => () => mockCopyText, { virtual: true })
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock('../../../constants/urls', () => ({
  useCreateExplorerUrl: () => () => '',
}))
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = { currentAccount: undefined }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('../../../utils/accountUtils', () => ({
  ellipsizeAddress: (address: string) => `short:${address}`,
  solAddressIsValid: () => false,
}))
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Card', () => ({ Card: 'Card' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('react-i18next', () => {
  const translation = {
    t: (key: string) => key,
    i18n: { exists: () => true },
  }
  return { useTranslation: () => translation }
})
jest.mock('react-native', () => ({
  View: 'View',
  Image: 'Image',
  ScrollView: 'ScrollView',
  Linking: { openURL: () => Promise.resolve() },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ArrowDownLeft: 'ArrowDownLeft',
  ArrowUpRight: 'ArrowUpRight',
  ChevronLeft: 'ChevronLeft',
  CircleX: 'CircleX',
  Ellipsis: 'Ellipsis',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// src/App.tsx: the root BottomSheetModalProvider wraps NavigationContainer,
// and the screen renders inside it.
const AppTree = () => (
  <BottomSheetModalProvider>
    <NavigationContainer>
      <ActivityDetailsScreen />
    </NavigationContainer>
  </BottomSheetModalProvider>
)

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

const COPY = 'settings.sections.account.copyAddress'

describe('ActivityDetailsScreen', () => {
  it('leaves the page scroll view without automatic content insets', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree />)
    })
    if (!renderer) throw new Error('render failed')
    const scrollView = renderer.root.findByType('ScrollView' as never)
    expect(scrollView.props.contentInsetAdjustmentBehavior).toBeUndefined()
  })

  it('opens the address actions sheet inside the screen and copies the address', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree />)
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    const screen = root.findByType(ActivityDetailsScreen)
    const menus = root.findAll(
      (node) =>
        node.type === ('PressableScale' as never) &&
        node.props.accessibilityLabel === 'collectablesScreen.transferActions',
    )
    expect(menus).toHaveLength(2)
    expect(textOf(root)).not.toContain(COPY)

    act(() => {
      menus[0].props.onPress()
    })

    // The screen's own sheet provider hosts the content, so it mounts in the
    // screen's subtree, not at the app root.
    expect(textOf(screen)).toContain(COPY)
    const copyRow = () => {
      const row = screen
        .findAllByType('PressableScale' as never)
        .find((node) => textOf(node).includes(COPY))
      if (!row) throw new Error('no copy row')
      return row
    }

    act(() => {
      copyRow().props.onPress()
    })

    expect(mockCopyText).toHaveBeenLastCalledWith({
      message: `short:${FROM}`,
      copyText: FROM,
    })
    expect(textOf(root)).not.toContain(COPY)

    act(() => {
      menus[1].props.onPress()
    })
    act(() => {
      copyRow().props.onPress()
    })

    expect(mockCopyText).toHaveBeenLastCalledWith({
      message: `short:${TO}`,
      copyText: TO,
    })
  })
})
