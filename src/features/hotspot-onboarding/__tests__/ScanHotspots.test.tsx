import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ScanHotspots from '../iot-ble/ScanHotspots'

type Device = { id: string; name: string }

// Each test sets the platform and the results of the BLE and permission
// calls. The mock factories read this object at render time.
const mockState: {
  os: string
  check: jest.Mock<Promise<string>, [string]>
  request: jest.Mock<Promise<string>, [string]>
  connect: jest.Mock<Promise<void>, [Device]>
  push: jest.Mock<void, [string]>
  stopScan: jest.Mock<void, []>
} = {
  os: 'ios',
  check: jest.fn(),
  request: jest.fn(),
  connect: jest.fn(),
  push: jest.fn(),
  stopScan: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ push: mockState.push, goBack: () => {} }),
}))

// One scanned device, so the list renders one row to press.
jest.mock('@helium/react-native-sdk', () => ({
  useHotspotBle: () => ({
    startScan: () => Promise.resolve(),
    stopScan: mockState.stopScan,
    connect: mockState.connect,
    scannedDevices: [{ id: 'd1', name: 'Dev1' }],
  }),
}))

jest.mock('../iot-ble/optionsContext', () => ({
  useIotBleOptions: () => ({ bleInstructions: 'Hold the pairing button.' }),
}))

jest.mock('../../../utils/logger', () => ({ error: () => {} }))

// The status strings match the real library's RESULTS values.
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: { ANDROID: { ACCESS_FINE_LOCATION: 'fine' } },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    LIMITED: 'limited',
  },
  check: (permission: string) => mockState.check(permission),
  request: (permission: string) => mockState.request(permission),
}))

jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// FlatList renders every item, so the device row is in the tree. Platform.OS
// is a getter, so each test can pick the platform before it renders.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    FlatList: ({
      data,
      renderItem,
    }: {
      data: Device[]
      renderItem: (info: { item: Device }) => React.ReactNode
    }) =>
      ReactActual.createElement(
        'FlatList',
        null,
        data.map((item) =>
          ReactActual.createElement(
            ReactActual.Fragment,
            { key: item.id },
            renderItem({ item }),
          ),
        ),
      ),
    PermissionsAndroid: { PERMISSIONS: {} },
    Platform: {
      get OS() {
        return mockState.os
      },
    },
    View: 'View',
  }
})
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  Plus: 'Plus',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<ScanHotspots />)
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

const deviceRow = (renderer: TestRenderer.ReactTestRenderer) => {
  const row = renderer.root
    .findAllByType('PressableScale' as never)
    .find((n) => String(n.props.className).includes('border-y'))
  if (!row) throw new Error('device row not rendered')
  return row
}

const scanButton = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('Button' as never)

const pressDeviceRow = async (renderer: TestRenderer.ReactTestRenderer) => {
  await act(async () => {
    await deviceRow(renderer).props.onPress()
    await Promise.resolve()
  })
}

describe('ScanHotspots', () => {
  beforeEach(() => {
    mockState.os = 'ios'
    mockState.check.mockReset()
    mockState.request.mockReset()
    mockState.connect.mockReset()
    mockState.push.mockReset()
    mockState.stopScan.mockReset()
  })

  it('re-enables the device row and shows the error when connect fails', async () => {
    mockState.connect.mockRejectedValue(new Error('boom'))
    const renderer = await render()

    await pressDeviceRow(renderer)

    expect(deviceRow(renderer).props.disabled).toBe(false)
    const texts = renderer.root
      .findAllByType('Text' as never)
      .map((n) => n.props.children)
    expect(texts).toContain('Error: boom')
    expect(mockState.push).not.toHaveBeenCalled()
  })

  it('re-enables the device row and pushes Settings when connect succeeds', async () => {
    mockState.connect.mockResolvedValue(undefined)
    const renderer = await render()

    await pressDeviceRow(renderer)

    expect(deviceRow(renderer).props.disabled).toBe(false)
    expect(mockState.push).toHaveBeenCalledWith('Settings')
  })

  // Only a granted location permission enables the scan. Any other check
  // result asks once, and only a granted answer enables the scan.
  it.each([
    ['granted', 'granted', true, 0],
    ['denied', 'granted', true, 1],
    ['denied', 'blocked', false, 1],
    ['blocked', 'blocked', false, 1],
    ['limited', 'denied', false, 1],
    ['unavailable', 'unavailable', false, 1],
  ])(
    'on Android, with check %s and request %s, enables the scan button: %s (%i requests)',
    async (checkResult, requestResult, enabled, requests) => {
      mockState.os = 'android'
      mockState.check.mockResolvedValue(checkResult)
      mockState.request.mockResolvedValue(requestResult)
      const renderer = await render()

      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockState.request).toHaveBeenCalledTimes(requests)
      expect(scanButton(renderer).props.disabled).toBe(!enabled)
    },
  )
})
