import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { QrScanner } from '../QrScanner'

const mockRequest = jest.fn()
const mockAlert = jest.fn()
const mockGoBack = jest.fn()
const mockOpenSettings = jest.fn()

// The node test runner cannot load react-native, expo-camera or i18n. The
// host components render as named elements so the test reads their props.
jest.mock('react-native', () => ({
  View: 'View',
  StyleSheet: { absoluteFill: {} },
  Platform: { OS: 'android' },
  Linking: { openSettings: () => mockOpenSettings(), openURL: jest.fn() },
}))
jest.mock('expo-camera', () => ({
  Camera: { requestCameraPermissionsAsync: () => mockRequest() },
  CameraView: 'CameraView',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))
jest.mock(
  '@hooks/useAlert',
  () => ({
    __esModule: true,
    default: () => ({ showOKCancelAlert: mockAlert }),
  }),
  { virtual: true },
)
jest.mock('../BackScreen', () => ({ BackScreen: 'BackScreen' }))

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

const mount = async (status: string, onScan = jest.fn()) => {
  mockRequest.mockResolvedValue({ status })
  let renderer!: TestRenderer.ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(<QrScanner onBarCodeScanned={onScan} />)
  })
  return renderer
}

beforeEach(() => jest.clearAllMocks())

describe('QrScanner', () => {
  it('shows no camera until access is granted', () => {
    mockRequest.mockReturnValue(new Promise(() => {}))
    const renderer = create(<QrScanner onBarCodeScanned={jest.fn()} />)

    expect(byType(renderer, 'CameraView')).toHaveLength(0)
  })

  it('reports the first scan only', async () => {
    const onScan = jest.fn()
    const renderer = await mount('granted', onScan)
    const scan = (data: string) =>
      act(() => {
        byType(renderer, 'CameraView')[0].props.onBarcodeScanned({ data })
      })

    scan('first')
    scan('second')

    expect(onScan).toHaveBeenCalledTimes(1)
    expect(onScan).toHaveBeenCalledWith('first')
  })

  it('offers the settings and goes back when access is denied', async () => {
    mockAlert.mockResolvedValue(true)
    const renderer = await mount('denied')

    expect(byType(renderer, 'CameraView')).toHaveLength(0)
    expect(mockAlert).toHaveBeenCalledTimes(1)
    expect(mockOpenSettings).toHaveBeenCalledTimes(1)
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })
})
