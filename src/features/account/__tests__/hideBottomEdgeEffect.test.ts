const mockRequireOptionalNativeModule = jest.fn()
const mockRequireNativeView = jest.fn()

jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    mockRequireOptionalNativeModule(name),
  requireNativeView: (name: string) => mockRequireNativeView(name),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Fresh module per case, so each case picks up its own native module mock
/* eslint-disable @typescript-eslint/no-require-imports */
const load = () =>
  require('../../../../modules/scroll-edge-effect') as typeof import('../../../../modules/scroll-edge-effect')
/* eslint-enable @typescript-eslint/no-require-imports */

beforeEach(() => {
  jest.resetModules()
  mockRequireOptionalNativeModule.mockReset()
  mockRequireNativeView.mockReset()
})

describe('HideBottomEdgeEffect', () => {
  it('is a plain View when the native module is missing (Android)', () => {
    mockRequireOptionalNativeModule.mockReturnValue(null)
    const { HideBottomEdgeEffect } = load()

    expect(HideBottomEdgeEffect).toBe('View')
    expect(mockRequireNativeView).not.toHaveBeenCalled()
  })

  it('is the native view when the module is linked (iOS)', () => {
    mockRequireOptionalNativeModule.mockReturnValue({})
    mockRequireNativeView.mockReturnValue('HiddenBottomEdgeEffectView')
    const { HideBottomEdgeEffect } = load()

    expect(mockRequireOptionalNativeModule).toHaveBeenCalledWith(
      'ScrollEdgeEffect',
    )
    expect(mockRequireNativeView).toHaveBeenCalledWith('ScrollEdgeEffect')
    expect(HideBottomEdgeEffect).toBe('HiddenBottomEdgeEffectView')
  })
})
