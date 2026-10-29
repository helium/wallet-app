const mockRequireOptionalNativeModule = jest.fn()

jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    mockRequireOptionalNativeModule(name),
}))

// Fresh module per case, so each case picks up its own native module mock
/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const load = () =>
  require('../../../modules/icloud-kvs') as typeof import('../../../modules/icloud-kvs')
/* eslint-enable global-require, @typescript-eslint/no-var-requires */

beforeEach(() => {
  jest.resetModules()
  mockRequireOptionalNativeModule.mockReset()
})

describe('getICloudKVSString', () => {
  it('throws when the native module is not linked', () => {
    mockRequireOptionalNativeModule.mockReturnValue(null)
    const { getICloudKVSString } = load()

    expect(() => getICloudKVSString('k')).toThrow(
      'ICloudKVS native module is not linked',
    )
  })

  it('reads the string from the native module', () => {
    mockRequireOptionalNativeModule.mockReturnValue({
      getString: (key: string) => (key === 'k' ? 'v' : null),
    })
    const { getICloudKVSString } = load()

    expect(getICloudKVSString('k')).toBe('v')
  })
})

export {}
