import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { NavigationContext } from '@react-navigation/native'
import {
  useTransactionDetail,
  withTransactionDetail,
} from '../TransactionDetail'

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
    BottomSheetScrollView: 'BottomSheetScrollView',
  }
})

// The line items call useNavigation, which throws outside a navigator.
// @react-navigation ships ESM that this runner cannot load, so this model
// keeps the hook's check: it reads NavigationContext and throws without one.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react')
  const Context = ReactActual.createContext(undefined)
  return {
    NavigationContext: Context,
    useNavigation: () => {
      const navigation = ReactActual.useContext(Context)
      if (!navigation) {
        throw new Error(
          "Couldn't find a navigation object. Is your component inside NavigationContainer?",
        )
      }
      return navigation
    },
  }
})

jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })
jest.mock('@hooks/useAlert', () => () => ({ showOKCancelAlert: () => {} }), {
  virtual: true,
})
jest.mock('@hooks/useCopyText', () => () => () => {}, { virtual: true })
jest.mock(
  '@utils/layout',
  () => ({ useContentColumnMargins: () => ({ marginLeft: 120 }) }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})

const txnDetails = {
  amount: '1 HNT',
  amountTitle: 'transactions.amount',
  color: 'text-success-500',
  fee: '',
  feePayer: '',
  icon: null,
  paymentsReceived: [],
  paymentsSent: [],
  time: 'today',
  title: 'Received HNT',
}
jest.mock('../useTxn', () => ({ useTxnDetails: () => txnDetails }))
jest.mock('../../../constants/urls', () => ({
  useCreateExplorerUrl: () => () => 'https://explorer',
}))
const accountStorage = { contacts: [], sortedAccounts: [] }
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => accountStorage,
}))
jest.mock('../../../utils/accountUtils', () => ({
  ellipsizeAddress: (a: string) => a,
}))
jest.mock('../../../utils/i18n', () => ({ locale: 'en' }))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Linking: { openURL: () => Promise.resolve() },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ChevronRight: 'ChevronRight' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let showDetail: ReturnType<typeof useTransactionDetail>['show'] | undefined
const Screen = () => {
  const { show } = useTransactionDetail()
  React.useEffect(() => {
    showDetail = show
  })
  return null
}
const DetailScreen = withTransactionDetail(Screen)

// src/App.tsx: the root BottomSheetModalProvider sits outside the navigator,
// and the account screens render inside it.
const AppTree = () => (
  <BottomSheetModalProvider>
    <NavigationContext.Provider value={{} as never}>
      <DetailScreen />
    </NavigationContext.Provider>
  </BottomSheetModalProvider>
)

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

describe('TransactionDetail', () => {
  it('opens the detail sheet inside the navigator', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree />)
    })
    if (!renderer || !showDetail) throw new Error('render failed')
    const { root } = renderer
    expect(textOf(root)).not.toContain('Received HNT')

    const show = showDetail
    act(() => {
      show({
        item: { hash: 'abc', height: 7 } as never,
        accountAddress: 'addr',
        mint: {} as never,
      })
    })

    expect(textOf(root)).toEqual(
      expect.arrayContaining(['Received HNT', '1 HNT', 'today', 'abc']),
    )
  })

  it('keeps the sheet in the content column', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree />)
    })
    if (!renderer) throw new Error('render failed')
    expect(renderer.root.findByType(BottomSheetModal).props.style).toEqual({
      marginLeft: 120,
    })
  })
})
