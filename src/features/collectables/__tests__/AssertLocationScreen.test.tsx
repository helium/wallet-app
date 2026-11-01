import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AssertLocationScreen from '../AssertLocationScreen'
import { mockCameraRef, mockMapRef, useCurrentPosition } from './mapLibreMock'

type AlertButton = { text: string; onPress?: () => void }

const SETTLED: [number, number] = [-105, 40]
const USER: [number, number] = [-104.5, 39.5]

const mockAlert = jest.fn<void, [string, string, AlertButton[]]>()
const mockImplicitBurn = jest.fn((_requiredDc: number) => Promise.resolve())
const mockSubmitUpdateEntityInfo = jest.fn(
  (_args: { lng: number; lat: number }) => Promise.resolve('batch'),
)

jest.mock('@maplibre/maplibre-react-native', () =>
  jest.requireActual('./mapLibreMock'),
)
jest.mock(
  '@hooks/useSubmitTxn',
  () => () => ({ submitUpdateEntityInfo: mockSubmitUpdateEntityInfo }),
  { virtual: true },
)
jest.mock(
  '@hooks/useImplicitBurn',
  () => ({ useImplicitBurn: () => ({ implicitBurn: mockImplicitBurn }) }),
  { virtual: true },
)
jest.mock(
  '@hooks/useOnboardingBalances',
  () => {
    const BN = jest.requireActual('bn.js')
    const balances = {
      // No maker, so the wallet pays and the DC burn runs.
      maker: undefined,
      makerDc: new BN(0),
      myDc: new BN(1_000_000),
      myDcWithHnt: new BN(1_000_000),
      loadingMyDc: false,
      loadingMyDcWithHnt: false,
      loadingMakerDc: false,
      locationAssertDcRequirements: {
        'iot-mint': new BN(500_000),
        'mobile-mint': new BN(500_000),
      },
      loadingLocationAssertDcRequirements: false,
    }
    return { useOnboardingBalnces: () => balances }
  },
  { virtual: true },
)
jest.mock('@hooks/useAlert', () => () => ({ showOKAlert: async () => {} }), {
  virtual: true,
})
jest.mock(
  '@hooks/useCurrentWallet',
  () => {
    const wallet = { toBase58: () => 'wallet' }
    return { useCurrentWallet: () => wallet }
  },
  { virtual: true },
)
jest.mock('@hooks/useEntityKey', () => ({ useEntityKey: () => 'entity' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useForwardGeo',
  () => ({ useForwardGeo: () => ({ execute: async () => undefined }) }),
  { virtual: true },
)
jest.mock('@hooks/useIotInfo', () => ({ useIotInfo: () => ({}) }), {
  virtual: true,
})
jest.mock('@hooks/useMobileInfo', () => ({ useMobileInfo: () => ({}) }), {
  virtual: true,
})
jest.mock(
  '@hooks/useReverseGeo',
  () => ({ useReverseGeo: () => ({ loading: false, result: 'Street' }) }),
  { virtual: true },
)
jest.mock('@helium/spl-utils', () => ({
  IOT_MINT: { toBase58: () => 'iot-mint' },
  MOBILE_MINT: { toBase58: () => 'mobile-mint' },
}))
jest.mock('@assets/images/hex.svg', () => 'Hex', { virtual: true })
jest.mock('@theme/motion', () => ({}), { virtual: true })
jest.mock('@utils/config', () => ({ PMTILES_URL: 'https://tiles' }), {
  virtual: true,
})
jest.mock(
  '@utils/dcWithHnt',
  () => jest.requireActual('../../../utils/dcWithHnt'),
  { virtual: true },
)
jest.mock('@utils/h3', () => ({ parseH3BNLocation: () => [] }), {
  virtual: true,
})
jest.mock(
  '@utils/hotspotNftsUtils',
  () => ({ removeDashAndCapitalize: (name: string) => name }),
  { virtual: true },
)
jest.mock('@utils/logger', () => ({ error: () => {} }), { virtual: true })
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() }
  const route = {
    params: {
      collectable: {
        content: { metadata: { name: 'hotspot', image: 'image' } },
        ownership: { owner: 'wallet' },
      },
    },
  }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  LocateFixed: 'LocateFixed',
  MapPin: 'MapPin',
  Search: 'Search',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Alert: {
    alert: (title: string, message: string, buttons: AlertButton[]) =>
      mockAlert(title, message, buttons),
  },
  Image: 'Image',
  Keyboard: { dismiss: () => {} },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios' },
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  View: 'View',
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: 'Animated.View',
    createAnimatedComponent: (c: unknown) => c,
  },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('text-encoding-polyfill', () => ({}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
// React Native defines window; use-debounce never calls back without it.
;(globalThis as { window?: unknown }).window = globalThis

const render = () => {
  let created: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    created = TestRenderer.create(<AssertLocationScreen />)
  })
  if (!created) throw new Error('render failed')
  const { root } = created
  const buttons = () => root.findAllByType('Button' as never)
  const map = () => root.findByType('Map' as never)
  // A disabled button ignores a tap, as the native Pressable does.
  const tap = (button: TestRenderer.ReactTestInstance) => {
    if (!button.props.disabled)
      act(() => {
        button.props.onPress()
      })
  }
  const assertButton = () => {
    const button = buttons().find((node) => node.props.variant === 'cta')
    if (!button) throw new Error('no assert button')
    return button
  }
  return {
    buttons,
    assertButton,
    tapAssert: () => tap(assertButton()),
    tapLocate: () => {
      const button = buttons().find(
        (node) => node.findAllByType('LocateFixed' as never).length > 0,
      )
      if (!button) throw new Error('no locate button')
      tap(button)
    },
    // The native map emits these events; a handler the screen does not set
    // is not called.
    moveStarts: () => {
      act(() => {
        map().props.onRegionWillChange?.({})
      })
    },
    moveEnds: (center: [number, number]) => {
      mockMapRef.getCenter.mockResolvedValue(center)
      act(() => {
        map().props.onRegionDidChange?.({})
      })
    },
  }
}

// Lets the region debounce run and the map's centre resolve.
const settle = async () => {
  await act(async () => {
    jest.advanceTimersByTime(200)
  })
}

// The user picks Mobile in the network Alert, if it showed.
const chooseMobile = async () => {
  const mobile = mockAlert.mock.lastCall?.[2].find(
    (button) => button.text === 'Mobile',
  )
  await act(async () => {
    mobile?.onPress?.()
  })
}

beforeEach(() => {
  jest.useFakeTimers()
  mockAlert.mockClear()
  mockImplicitBurn.mockClear()
  mockSubmitUpdateEntityInfo.mockClear()
  mockCameraRef.setStop.mockClear()
  useCurrentPosition.mockReturnValue({
    coords: { longitude: USER[0], latitude: USER[1] },
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('AssertLocationScreen', () => {
  // An assert sent before the new centre is stored burns DC for the old one.
  it('blocks an assert while the camera moves to the user location', async () => {
    const view = render()
    view.moveStarts()
    view.moveEnds(SETTLED)
    await settle()
    expect(view.assertButton().props.disabled).toBe(false)

    view.tapLocate()
    expect(mockCameraRef.setStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: USER, duration: 500 }),
    )
    view.moveStarts()
    view.moveEnds(USER)
    expect(view.assertButton().props.disabled).toBe(true)
    view.tapAssert()
    await chooseMobile()
    expect(mockImplicitBurn).not.toHaveBeenCalled()
    expect(mockSubmitUpdateEntityInfo).not.toHaveBeenCalled()

    await settle()
    view.tapAssert()
    await chooseMobile()
    expect(mockImplicitBurn).toHaveBeenCalledTimes(1)
    expect(mockSubmitUpdateEntityInfo).toHaveBeenCalledTimes(1)
    expect(mockSubmitUpdateEntityInfo).toHaveBeenCalledWith(
      expect.objectContaining({ lng: USER[0], lat: USER[1] }),
    )
  })

  // A drag that starts while the last one's centre is pending must not
  // re-enable the button mid-drag.
  it('keeps assert blocked when a new move starts before the last settles', async () => {
    const view = render()
    view.moveStarts()
    view.moveEnds(SETTLED)
    view.moveStarts()
    await settle()
    expect(view.assertButton().props.disabled).toBe(true)

    view.moveEnds(USER)
    await settle()
    expect(view.assertButton().props.disabled).toBe(false)
  })

  // The Alert's Mobile button runs after the Alert opened; the centre can move
  // in between.
  it('asserts the centre stored when Mobile is chosen', async () => {
    const view = render()
    view.moveStarts()
    view.moveEnds(SETTLED)
    await settle()

    view.tapAssert()
    expect(mockAlert).toHaveBeenCalledTimes(1)
    view.moveStarts()
    view.moveEnds(USER)
    await settle()
    await chooseMobile()

    expect(mockImplicitBurn).toHaveBeenCalledTimes(1)
    expect(mockSubmitUpdateEntityInfo).toHaveBeenCalledTimes(1)
    expect(mockSubmitUpdateEntityInfo).toHaveBeenCalledWith(
      expect.objectContaining({ lng: USER[0], lat: USER[1] }),
    )
  })

  // A centre read that resolves after a new move began is stale; storing it
  // would end the new move early and assert the old centre.
  it('drops a centre read still in flight when a new move starts', async () => {
    const view = render()
    view.moveStarts()
    view.moveEnds(SETTLED)
    await settle()
    view.tapAssert()
    expect(mockAlert).toHaveBeenCalledTimes(1)

    let readCenter: (center: [number, number]) => void = () => {}
    view.moveStarts()
    view.moveEnds(USER)
    mockMapRef.getCenter.mockReturnValueOnce(
      new Promise((resolve) => {
        readCenter = resolve
      }),
    )
    await settle()
    view.moveStarts()
    await act(async () => {
      readCenter(USER)
    })

    expect(view.assertButton().props.disabled).toBe(true)
    view.tapAssert()
    await chooseMobile()
    expect(mockImplicitBurn).not.toHaveBeenCalled()
    expect(mockSubmitUpdateEntityInfo).not.toHaveBeenCalled()
  })

  // The Alert stays open while the user drags the map; Mobile must not send
  // the centre the camera is leaving.
  it('blocks Mobile from the open Alert once the camera starts moving', async () => {
    const view = render()
    view.moveStarts()
    view.moveEnds(SETTLED)
    await settle()
    view.tapAssert()
    expect(mockAlert).toHaveBeenCalledTimes(1)

    view.moveStarts()
    await chooseMobile()

    expect(mockImplicitBurn).not.toHaveBeenCalled()
    expect(mockSubmitUpdateEntityInfo).not.toHaveBeenCalled()
  })

  // The Iot overlay has its own Assert button; it must wait for the camera too.
  it('blocks the Iot overlay assert while the camera moves', async () => {
    const view = render()
    view.moveStarts()
    view.moveEnds(SETTLED)
    await settle()
    view.tapAssert()
    const iot = mockAlert.mock.lastCall?.[2].find(
      (button) => button.text === 'Iot',
    )
    await act(async () => {
      iot?.onPress?.()
    })
    const overlayAssert = () => {
      const button = view
        .buttons()
        .find((node) => node.props.variant === 'outline')
      if (!button) throw new Error('no overlay assert button')
      return button
    }
    expect(overlayAssert().props.disabled).toBe(false)

    view.moveStarts()
    expect(overlayAssert().props.disabled).toBe(true)

    view.moveEnds(USER)
    await settle()
    expect(overlayAssert().props.disabled).toBe(false)
  })
})
