import React from 'react'
import EventEmitter from 'events'
import TestRenderer, { act } from 'react-test-renderer'
import SignTxModal from '../SignTx/SignTxModal'
import { KeystoneSolSignRequest } from '../types/keystoneSolanaTxType'

// Each scanned frame is one part of a multi-part signature.
jest.mock('../SignTx/signatureScanner', () => ({
  createSignatureScanner: () => ({
    reset: () => {},
    receive: () => ({ status: 'progress', progress: 40 }),
  }),
}))
jest.mock('@keystonehq/keystone-sdk', () => ({
  __esModule: true,
  default: class {
    sol = {
      generateSignRequest: () => ({ type: 'sol-sign-request', cbor: '' }),
    }
  },
}))
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  },
  CameraView: 'CameraView',
}))
jest.mock('../components/StaticQrCode', () => ({
  AnimatedQrCode: 'AnimatedQrCode',
}))
jest.mock('../components/ProgressBar', () => 'ProgressBar')
jest.mock('../components/CameraScannerLayout', () => ({
  CameraScannerLayout: 'CameraScannerLayout',
}))
jest.mock('@hooks/useAlert', () => () => ({ showOKCancelAlert: () => {} }), {
  virtual: true,
})
jest.mock('@ui/CloseButton', () => ({ CloseButton: 'CloseButton' }), {
  virtual: true,
})
jest.mock('@assets/images/keystoneLogo.svg', () => 'KeystoneLogo', {
  virtual: true,
})
jest.mock('@theme/themeHooks', () => ({ useHitSlop: () => undefined }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Alert: { alert: () => {} },
  Linking: {},
  Platform: { OS: 'ios' },
  StyleSheet: { absoluteFill: {} },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const signRequest = (requestId: string): KeystoneSolSignRequest => ({
  requestId,
  signData: '01',
  dataType: 1,
  path: "m/44'/501'/0'/0'",
  xfp: '12345678',
  origin: 'Helium',
})

describe('SignTxModal', () => {
  it('drops the scan progress of the previous sign request', async () => {
    const eventEmitter = new EventEmitter()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    await act(async () => {
      renderer = TestRenderer.create(
        <SignTxModal
          eventEmitter={eventEmitter}
          solSignRequest={signRequest('first')}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    await act(async () => {
      root.findByType('Button' as never).props.onPress()
    })
    act(() => {
      root
        .find((n) => typeof n.props.onBarCodeScanned === 'function')
        .props.onBarCodeScanned('ur:sol-signature/part')
    })
    expect(root.findAllByType('ProgressBar' as never)).toHaveLength(1)

    await act(async () => {
      renderer?.update(
        <SignTxModal
          eventEmitter={eventEmitter}
          solSignRequest={signRequest('second')}
        />,
      )
    })

    expect(root.findAllByType('ProgressBar' as never)).toHaveLength(0)
  })
})
