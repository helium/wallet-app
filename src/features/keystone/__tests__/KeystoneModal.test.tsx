import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import KeystoneModal, { KeystoneModalRef } from '../KeystoneModal'
import SignTxModal from '../SignTx/SignTxModal'

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
    BottomSheetView: 'BottomSheetView',
  }
})

jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@hooks/useAlert', () => () => ({ showOKCancelAlert: () => {} }), {
  virtual: true,
})
jest.mock(
  '@components/ContentColumn',
  () => ({ useSheetMargins: () => ({}) }),
  { virtual: true },
)
jest.mock('@components/CloseButton', () => 'CloseButton', { virtual: true })
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const accountStorage = {
      currentAccount: {
        derivationPath: "m/44'/501'/0'/0'",
        keystoneDevice: { masterFingerprint: '12345678' },
      },
    }
    return { useAccountStorage: () => accountStorage }
  },
  { virtual: true },
)
jest.mock('@assets/images/keystoneLogo.svg', () => 'KeystoneLogo', {
  virtual: true,
})
jest.mock('@theme/motion', () => ({ SPRING: {} }), { virtual: true })
jest.mock('@theme/themeHooks', () => ({ useHitSlop: () => undefined }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('react-native-qrcode-svg', () => 'QRCode')
jest.mock('expo-camera', () => ({ Camera: {}, CameraView: 'CameraView' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Image: 'Image',
  Alert: { alert: () => {} },
  Linking: {},
  Platform: { OS: 'ios' },
  StyleSheet: { absoluteFill: {} },
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({
  withUniwind: (c: unknown) => c,
  useResolveClassNames: () => ({}),
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('KeystoneModal', () => {
  // src/App.tsx: the root BottomSheetModalProvider sits outside
  // SolanaProvider, which renders KeystoneModal around the app.
  it('presents the sign sheet inside its own provider and settles on close', async () => {
    const ref = React.createRef<KeystoneModalRef>()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <BottomSheetModalProvider>
          <KeystoneModal ref={ref}>{null}</KeystoneModal>
        </BottomSheetModalProvider>,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    let signature: Promise<Buffer | undefined> | undefined
    act(() => {
      signature = ref.current?.showKeystoneModal({
        transaction: Buffer.from('01', 'hex'),
      })
    })
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    const modal = root.findByType(KeystoneModal)
    expect(modal.findAllByType(SignTxModal)).toHaveLength(1)
    expect(
      modal.findAllByType('Text' as never).map((n) => n.props.children),
    ).toContain('keystone.payment.scanTxQrcodeScreenTitle')
    expect(modal.findAllByType('QRCode' as never)).toHaveLength(1)

    act(() => {
      modal.findByType('CloseButton' as never).props.onPress()
    })

    await expect(signature).resolves.toEqual(Buffer.from([]))
    expect(modal.findAllByType(SignTxModal)).toHaveLength(0)
  })
})
