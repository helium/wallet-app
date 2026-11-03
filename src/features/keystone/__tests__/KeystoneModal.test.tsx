import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import KeystoneModal, { KeystoneModalRef } from '../KeystoneModal'
import SignTxModal from '../SignTx/SignTxModal'

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider, and
// dismiss() unmounts it and calls onDismiss when its close animation ends.
// 250 ms is gorhom's Android ANIMATION_DURATION (constants.ts). iOS uses a
// spring that settles near 500 ms. Both end before the 1 s present timer.
const mockCloseAnimationMs = 250
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
    (
      {
        children,
        onDismiss,
      }: { children: React.ReactNode; onDismiss?: () => void },
      ref: unknown,
    ) => {
      const hostName = ReactActual.useContext(HostName)
      const [mount, setMount] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setMount(true),
        dismiss: () => {
          setTimeout(() => {
            setMount(false)
            onDismiss?.()
          }, mockCloseAnimationMs)
        },
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
  () => jest.requireActual('../../../hooks/useBackHandler'),
  { virtual: true },
)
jest.mock('@hooks/useAlert', () => () => ({ showOKCancelAlert: () => {} }), {
  virtual: true,
})
jest.mock('@ui/ContentColumn', () => ({ useSheetMargins: () => ({}) }), {
  virtual: true,
})
jest.mock('@ui/CloseButton', () => ({ CloseButton: 'CloseButton' }), {
  virtual: true,
})
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
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('react-native-qrcode-svg', () => 'QRCode')
jest.mock('expo-camera', () => ({ Camera: {}, CameraView: 'CameraView' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
const mockPlatform = { OS: 'ios' }
const mockBackPressListeners = new Set<() => boolean>()
jest.mock('react-native', () => ({
  BackHandler: {
    addEventListener: (_: string, listener: () => boolean) => {
      mockBackPressListeners.add(listener)
      return { remove: () => mockBackPressListeners.delete(listener) }
    },
  },
  View: 'View',
  Alert: { alert: () => {} },
  Linking: {},
  // A getter: the hoisted factory runs before mockPlatform is assigned.
  get Platform() {
    return mockPlatform
  },
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
  mockPlatform.OS = 'ios'
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
    act(() => {
      jest.advanceTimersByTime(mockCloseAnimationMs)
    })

    await expect(signature).resolves.toEqual(Buffer.from([]))
    expect(modal.findAllByType(SignTxModal)).toHaveLength(0)
  })

  // Backdrop tap, swipe down and the back button close the sheet through
  // onDismiss only, with no close event.
  it('settles the pending request with an empty signature on sheet dismiss', async () => {
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

    act(() => {
      root
        .find((n) => typeof n.props.onDismiss === 'function')
        .props.onDismiss()
    })

    await expect(signature).resolves.toEqual(Buffer.from([]))
  })
  it('dismisses the sign sheet and settles the request on Android back', async () => {
    mockPlatform.OS = 'android'
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

    let handled: boolean[] = []
    act(() => {
      handled = [...mockBackPressListeners].map((listener) => listener())
    })
    act(() => {
      jest.advanceTimersByTime(mockCloseAnimationMs)
    })

    expect(handled).toContain(true)
    await expect(signature).resolves.toEqual(Buffer.from([]))
    expect(modal.findAllByType(SignTxModal)).toHaveLength(0)
  })

  // SolanaProvider signAllTransactions shows the next sign request as soon
  // as the previous one resolves, while the previous sheet still animates
  // closed.
  it('does not settle the next request when the previous sheet finishes closing', async () => {
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
    const modal = renderer.root.findByType(KeystoneModal)
    const emitSignature = (signature: string) => {
      const { eventEmitter, solSignRequest } =
        modal.findByType(SignTxModal).props
      eventEmitter.emit(
        `keystoneSignature_${solSignRequest.requestId}`,
        signature,
      )
    }

    let first: Promise<Buffer | undefined> | undefined
    act(() => {
      first = ref.current?.showKeystoneModal({
        transaction: Buffer.from('01', 'hex'),
      })
    })
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      emitSignature('aa')
    })
    await expect(first).resolves.toEqual(Buffer.from('aa', 'hex'))

    let second: Promise<Buffer | undefined> | undefined
    act(() => {
      second = ref.current?.showKeystoneModal({
        transaction: Buffer.from('02', 'hex'),
      })
    })
    let secondSettled = false
    void second?.then(() => {
      secondSettled = true
    })
    await act(async () => {
      jest.advanceTimersByTime(mockCloseAnimationMs)
    })
    expect(secondSettled).toBe(false)

    act(() => {
      jest.advanceTimersByTime(1000 - mockCloseAnimationMs)
    })
    act(() => {
      emitSignature('bb')
    })
    await expect(second).resolves.toEqual(Buffer.from('bb', 'hex'))
  })

  // SignTxModal emits the close event without a request id, so a close tap
  // on the previous sheet while it animates closed reaches the next request
  // before its present timer fires.
  it('does not present the sheet for a request that settles before its present timer', async () => {
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
    const modal = renderer.root.findByType(KeystoneModal)

    let first: Promise<Buffer | undefined> | undefined
    act(() => {
      first = ref.current?.showKeystoneModal({
        transaction: Buffer.from('01', 'hex'),
      })
    })
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    const { eventEmitter, solSignRequest } = modal.findByType(SignTxModal).props
    act(() => {
      eventEmitter.emit(`keystoneSignature_${solSignRequest.requestId}`, 'aa')
    })
    await expect(first).resolves.toEqual(Buffer.from('aa', 'hex'))

    let second: Promise<Buffer | undefined> | undefined
    act(() => {
      second = ref.current?.showKeystoneModal({
        transaction: Buffer.from('02', 'hex'),
      })
    })
    act(() => {
      eventEmitter.emit('closeKeystoneSignatureModal')
    })
    await expect(second).resolves.toEqual(Buffer.from([]))

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(modal.findAllByType(SignTxModal)).toHaveLength(0)
  })
})
