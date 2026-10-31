import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import LedgerModal, { LedgerModalRef } from '../LedgerModal'

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

// A stored USB device whose transport fails: the session lands on the
// connect-error steps.
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const accountStorage = {
      currentAccount: {
        accountIndex: 0,
        derivationPath: "44'/501'/0'/0'",
        ledgerDevice: { id: 'device-id', name: 'Nano X', type: 'usb' },
      },
      upsertAccount: () => Promise.resolve(),
    }
    return { useAccountStorage: () => accountStorage }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useLedger',
  () => {
    const ledger = {
      getTransport: () => Promise.reject(new Error('transport')),
      findBleDevice: () => Promise.resolve(undefined),
      openBleDevice: () => Promise.resolve(undefined),
      openSolanaApp: () => Promise.resolve(),
      reconnectAfterAppOpen: () => Promise.resolve(undefined),
      waitForSolanaApp: () => Promise.resolve(),
    }
    return { __esModule: true, default: () => ledger }
  },
  { virtual: true },
)
jest.mock(
  '@utils/heliumLedger',
  () => ({
    classifyLedgerError: () => 'transport',
    signLedgerMessage: () => Promise.resolve(Buffer.from('')),
    signLedgerTransaction: () => Promise.resolve(Buffer.from('')),
    getDerivationTypeForSigning: () => undefined,
  }),
  { virtual: true },
)
jest.mock('@ledgerhq/types-devices', () => ({
  DeviceModelId: {
    blue: 'blue',
    nanoS: 'nanoS',
    nanoSP: 'nanoSP',
    nanoX: 'nanoX',
    stax: 'stax',
  },
}))
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock(
  '@components/ContentColumn',
  () => ({ useSheetMargins: () => ({}) }),
  { virtual: true },
)
jest.mock('@components/CloseButton', () => 'CloseButton', { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('../Animation', () => () => null)
jest.mock('../getDeviceAnimation', () => ({ getDeviceAnimation: () => null }))
jest.mock('react-i18next', () => {
  const translation = {
    t: (key: string, options?: { returnObjects?: boolean }) =>
      options?.returnObjects ? ['step one', 'step two'] : key,
  }
  return { useTranslation: () => translation }
})
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({
  withUniwind: (c: unknown) => c,
  useResolveClassNames: () => ({}),
}))
jest.mock('lucide-react-native', () => ({
  Check: 'Check',
  CircleX: 'CircleX',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// src/solana/SolanaProvider.tsx renders LedgerModal inside its own providers
// (the account fetch cache and the Solana context), which sit below the root
// BottomSheetModalProvider of src/App.tsx.
const SolanaProviders = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

const textOf = (node: TestRenderer.ReactTestInstance) =>
  ['Text', 'Button'].flatMap((type) =>
    node.findAllByType(type as never).map((n) => n.props.children),
  )

describe('LedgerModal', () => {
  it('renders the sheet content inside the Solana providers', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const ref = React.createRef<LedgerModalRef>()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <BottomSheetModalProvider>
          <SolanaProviders>
            <LedgerModal ref={ref}>{null}</LedgerModal>
          </SolanaProviders>
        </BottomSheetModalProvider>,
      )
    })
    if (!renderer) throw new Error('render failed')
    const inside = renderer.root.findByType(SolanaProviders)
    expect(inside.findAllByType('CloseButton' as never)).toHaveLength(0)

    await act(async () => {
      void ref.current
        ?.showLedgerModal({ transaction: Buffer.from('tx') })
        .catch(() => {})
    })

    expect(inside.findAllByType('CloseButton' as never)).toHaveLength(1)
    expect(textOf(inside)).toEqual(
      expect.arrayContaining([
        'ledger.connectError.title',
        'step one',
        'generic.tryAgain',
      ]),
    )
  })
})
