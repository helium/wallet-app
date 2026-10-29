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

describe('setICloudKVSString', () => {
  it('throws when the native module is not linked', () => {
    mockRequireOptionalNativeModule.mockReturnValue(null)
    const { setICloudKVSString } = load()

    expect(() => setICloudKVSString('k', 'v')).toThrow(
      'ICloudKVS native module is not linked',
    )
  })

  it('passes the key and value to the native module', () => {
    const setString = jest.fn()
    mockRequireOptionalNativeModule.mockReturnValue({ setString })
    const { setICloudKVSString } = load()

    setICloudKVSString('k', 'v')

    expect(setString).toHaveBeenCalledTimes(1)
    expect(setString).toHaveBeenCalledWith('k', 'v')
  })
})

describe('removeICloudKVSKeys', () => {
  it('throws when the native module is not linked', () => {
    mockRequireOptionalNativeModule.mockReturnValue(null)
    const { removeICloudKVSKeys } = load()

    expect(() => removeICloudKVSKeys(['a'])).toThrow(
      'ICloudKVS native module is not linked',
    )
  })

  it('passes the keys to the native module', () => {
    const remove = jest.fn()
    mockRequireOptionalNativeModule.mockReturnValue({ remove })
    const { removeICloudKVSKeys } = load()

    removeICloudKVSKeys(['a', 'b'])

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(['a', 'b'])
  })
})

export {}
