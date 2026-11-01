import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import useCopyText from '../useCopyText'

const mockTriggerNavHaptic = jest.fn()
const mockSetString = jest.fn()
const mockSetStringAsync = jest.fn((_text: string, _options?: unknown) =>
  Promise.resolve(true),
)

jest.mock('../useHaptic', () => () => ({
  triggerNavHaptic: mockTriggerNavHaptic,
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: (text: string) => mockSetString(text),
}))
jest.mock('expo-clipboard', () => ({
  setStringAsync: (text: string, options?: unknown) =>
    mockSetStringAsync(text, options),
}))
const mockToastShow = jest.fn()
jest.mock('react-native-simple-toast', () => ({
  show: (...args: unknown[]) => mockToastShow(...args),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const copyWith = (...args: Parameters<typeof useCopyText>) => {
  let copyText: ReturnType<typeof useCopyText> | undefined
  const Probe = () => {
    copyText = useCopyText(...args)
    return null
  }
  act(() => {
    TestRenderer.create(React.createElement(Probe))
  })
  copyText?.({ copyText: 'address' })
}

describe('useCopyText', () => {
  beforeEach(() => {
    mockTriggerNavHaptic.mockClear()
    mockSetString.mockClear()
    mockSetStringAsync.mockClear()
    mockToastShow.mockClear()
  })

  it('fires one haptic per copy by default', () => {
    copyWith()

    expect(mockSetString).toHaveBeenCalledWith('address')
    expect(mockTriggerNavHaptic).toHaveBeenCalledTimes(1)
  })

  it('fires no haptic when the caller sits on a haptic wrapper', () => {
    copyWith({ haptic: false })

    expect(mockSetString).toHaveBeenCalledWith('address')
    expect(mockTriggerNavHaptic).not.toHaveBeenCalled()
  })

  it('copies a plain clip by default', () => {
    copyWith()

    expect(mockSetString).toHaveBeenCalledWith('address')
    expect(mockSetStringAsync).not.toHaveBeenCalled()
  })

  // Android 13+ shows any copy in the clipboard preview unless the clip
  // carries ClipDescription.EXTRA_IS_SENSITIVE.
  it('marks a sensitive copy so Android hides it from the clipboard preview', () => {
    copyWith({ sensitive: true })

    expect(mockSetStringAsync).toHaveBeenCalledWith('address', {
      android: { isSensitive: true },
    })
    expect(mockSetString).not.toHaveBeenCalled()
  })

  it('shows no copied toast when the sensitive copy fails', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockSetStringAsync.mockRejectedValueOnce(new Error('copy failed'))

    copyWith({ sensitive: true })
    await act(async () => {})

    expect(mockToastShow).not.toHaveBeenCalled()
    consoleWarn.mockRestore()
  })

  it('shows the copied toast once the sensitive copy succeeds', async () => {
    copyWith({ sensitive: true })
    await act(async () => {})

    expect(mockToastShow).toHaveBeenCalledTimes(1)
  })
})
