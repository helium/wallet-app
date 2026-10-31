import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import HotspotBLENav from '../iot-ble/HotspotBLENav'

const BLE_INSTRUCTIONS = 'Hold the pairing button for five seconds.'

// The route the onboarding stack pushes with the device's options. A stable
// object, as the real route is between renders.
jest.mock('@react-navigation/native', () => {
  const route = {
    params: { bleInstructions: 'Hold the pairing button for five seconds.' },
  }
  const navigation = { goBack: () => {}, push: () => {} }
  return { useRoute: () => route, useNavigation: () => navigation }
})

// @react-navigation ships ESM only, which this jest config does not
// transform. The model renders the stack's first screen, as the real stack
// does on mount.
jest.mock('@react-navigation/native-stack', () => {
  const ReactActual = jest.requireActual('react')
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => {
        const [first] = ReactActual.Children.toArray(children) as {
          props: { component: React.ComponentType }
        }[]
        return ReactActual.createElement(first.props.component)
      },
      Screen: () => null,
    }),
  }
})

// useHotspotBle reads the provider's context and throws outside it, as the
// SDK's hook does when no HotspotBleProvider is above it.
jest.mock('@helium/react-native-sdk', () => {
  const ReactActual = jest.requireActual('react')
  const HotspotBle = ReactActual.createContext(undefined)
  const ble = {
    startScan: () => Promise.resolve(),
    stopScan: () => {},
    connect: () => Promise.resolve(),
    scannedDevices: [],
  }
  return {
    HotspotBleProvider: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(HotspotBle.Provider, { value: ble }, children),
    useHotspotBle: () => {
      const value = ReactActual.useContext(HotspotBle)
      if (!value) throw new Error('useHotspotBle must be in HotspotBleProvider')
      return value
    },
  }
})

// The other screens only render after a push.
jest.mock('../iot-ble/AddGatewayBle', () => 'AddGatewayBle')
jest.mock('../iot-ble/Settings', () => 'Settings')
jest.mock('../iot-ble/WifiSettings', () => 'WifiSettings')
jest.mock('../iot-ble/Diagnostics', () => 'Diagnostics')
jest.mock('../iot-ble/WifiSetup', () => 'WifiSetup')

jest.mock('../../../utils/logger', () => ({ error: () => {} }))
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: { ANDROID: {} },
  RESULTS: {},
  check: () => Promise.resolve(),
  request: () => Promise.resolve(),
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
jest.mock('react-native', () => ({
  FlatList: 'FlatList',
  PermissionsAndroid: { PERMISSIONS: {} },
  Platform: { OS: 'ios' },
  View: 'View',
}))
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

describe('HotspotBLENav', () => {
  // ScanHotspots, the first screen, reads the BLE context and the device's
  // options from the providers the navigator wraps around its stack.
  it('renders the scan screen with the device instructions from the route', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    await act(async () => {
      renderer = TestRenderer.create(<HotspotBLENav />)
    })
    if (!renderer) throw new Error('render failed')

    const texts = renderer.root
      .findAllByType('Text' as never)
      .map((n) => n.props.children)
    expect(texts).toContain('hotspotOnboarding.scan.title')
    expect(texts).toContain(BLE_INSTRUCTIONS)
    expect(texts).not.toContain('hotspotOnboarding.scan.subtitle')
  })
})
