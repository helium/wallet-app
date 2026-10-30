import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import useSecureWindow from '../useSecureWindow'

// Android hides a secret screen from recents, screenshots and screen capture
// with FLAG_SECURE, set through the local SecureWindow module. The flag stays
// on while any secret screen shows. iOS has no such module.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn((_secure: boolean) => Promise.resolve())
// a build without the native module; undefined while the imports run
const mockBuild = { withoutNativeModule: false }

jest.mock('react-native', () => ({
  Platform: {
    // undefined at import: useSecureWindow reads it before mockPlatform is set
    get OS() {
      return mockPlatform?.OS
    },
  },
}))
// the hook looks the module up at import, before mockSetSecure is set
jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    name === 'SecureWindow' && !mockBuild?.withoutNativeModule
      ? { setSecure: (secure: boolean) => mockSetSecure(secure) }
      : null,
}))

const Holder = ({ active }: { active?: boolean }) => {
  useSecureWindow(active)
  return null
}

const mount = (props: { active?: boolean } = {}) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(React.createElement(Holder, props))
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('useSecureWindow', () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    mockPlatform.OS = 'android'
    mockBuild.withoutNativeModule = false
    mockSetSecure.mockClear()
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('sets the flag at mount and clears it at unmount on Android', () => {
    const renderer = mount()
    expect(mockSetSecure.mock.calls).toEqual([[true]])
    act(() => renderer.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
  })

  it('keeps the flag while another secret screen still shows', () => {
    const screen = mount()
    const lock = mount()
    act(() => lock.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true]])
    act(() => screen.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
  })

  it('follows the active argument', () => {
    const renderer = mount({ active: false })
    expect(mockSetSecure).not.toHaveBeenCalled()
    act(() => renderer.update(React.createElement(Holder, { active: true })))
    expect(mockSetSecure.mock.calls).toEqual([[true]])
    act(() => renderer.update(React.createElement(Holder, { active: false })))
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
    act(() => renderer.unmount())
    expect(mockSetSecure.mock.calls).toEqual([[true], [false]])
  })

  it('does nothing on iOS', () => {
    mockPlatform.OS = 'ios'
    const renderer = mount()
    act(() => renderer.unmount())
    expect(mockSetSecure).not.toHaveBeenCalled()
  })

  it('warns once and does nothing on Android without the native module', () => {
    mockBuild.withoutNativeModule = true
    jest.isolateModules(() => {
      // a fresh registry runs the import-time lookup again; React and the
      // renderer come from the same registry as the hook
      const IsolatedReact = jest.requireActual('react')
      const Isolated = jest.requireActual('react-test-renderer')
      const isolatedHook = jest.requireActual('../useSecureWindow').default
      const IsolatedHolder = () => {
        isolatedHook()
        return null
      }
      let renderer: TestRenderer.ReactTestRenderer | undefined
      Isolated.act(() => {
        renderer = Isolated.create(IsolatedReact.createElement(IsolatedHolder))
      })
      Isolated.act(() => renderer?.unmount())
    })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(
      /SecureWindow native module is missing/,
    )
    expect(mockSetSecure).not.toHaveBeenCalled()
  })

  it('logs a failed setSecure instead of leaving the rejection unhandled', async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    const failure = new Error('MissingActivity')
    mockSetSecure.mockImplementationOnce(() => Promise.reject(failure))
    try {
      const renderer = mount()
      act(() => renderer.unmount())
      await new Promise((resolve) => setImmediate(resolve))
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
    expect(unhandled).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.any(String), failure)
  })
})
