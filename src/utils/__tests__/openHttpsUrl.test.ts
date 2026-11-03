const mockOpenURL = jest.fn(() => Promise.resolve())
jest.mock('react-native', () => ({ Linking: { openURL: mockOpenURL } }))

// The app's URL is react-native-url-polyfill (index.js), backed by this
// parser; Node's URL lowercases the host and hides the bug
const NodeURL = globalThis.URL
let openHttpsUrl: (url: string | undefined) => void

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/no-extraneous-dependencies
  globalThis.URL = require('whatwg-url-without-unicode').URL
  // WALLET_LINK_HOST is computed at import, so import after the swap
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ;({ openHttpsUrl } = require('../openHttpsUrl'))
  })
})

afterAll(() => {
  globalThis.URL = NodeURL
})

beforeEach(() => {
  mockOpenURL.mockClear()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('openHttpsUrl', () => {
  it('runs on a parser that keeps host case', () => {
    expect(new URL('https://WALLET.helium.com/').hostname).toBe(
      'WALLET.helium.com',
    )
  })

  it.each([
    'https://wallet.helium.com/import_key/abc',
    'https://WALLET.helium.com/import_key/abc',
    'https://Wallet.Helium.Com/import_key/abc',
    'https://wallet.helium.com./import_key/abc',
    'https://wallet.helium.com%2E/import_key/abc',
  ])('does not open the wallet link host: %s', (url) => {
    openHttpsUrl(url)
    expect(mockOpenURL).not.toHaveBeenCalled()
  })

  it('opens another https host', () => {
    openHttpsUrl('https://example.com/x')
    expect(mockOpenURL).toHaveBeenCalledWith('https://example.com/x')
  })
})
