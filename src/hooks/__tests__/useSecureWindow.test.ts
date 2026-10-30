import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import useSecureWindow from '../useSecureWindow'

// Android hides a secret screen from recents, screenshots and screen capture
// with FLAG_SECURE, set through the local SecureWindow module. The flag stays
// on while any secret screen shows. iOS has no such module.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockPlatform = { OS: 'android' }
const mockSetSecure = jest.fn()

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatform.OS
    },
  },
}))
// the hook looks the module up at import, before mockSetSecure is set
jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    name === 'SecureWindow'
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
  beforeEach(() => {
    mockPlatform.OS = 'android'
    mockSetSecure.mockClear()
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
})
