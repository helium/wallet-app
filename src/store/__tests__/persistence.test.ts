/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const mockImportLegacyState = jest.fn()

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
)
// The real store and its persist config, over a one-slice reducer
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useStore: jest.fn(),
}))
jest.mock('../../../ReactotronConfig', () => ({
  __esModule: true,
  default: {},
}))
jest.mock('../rootReducer', () => ({
  __esModule: true,
  default: (state = { hotspots: {} }) => state,
}))
jest.mock('../slices/solanaSlice', () => ({ name: 'solana' }))
jest.mock('../slices/balancesSlice', () => ({ name: 'balances' }))
jest.mock('../../storage/importLegacyState', () => ({
  importLegacyState: () => mockImportLegacyState(),
}))

// What a main build left under the old redux-persist root key
const LEGACY_ROOT = JSON.stringify({
  app: JSON.stringify({ cluster: 'devnet' }),
  _persist: JSON.stringify({ version: 1, rehydrated: true }),
})

declare const globalThis: { IS_REACT_ACT_ENVIRONMENT?: boolean }

// Fresh modules per case, so each case runs the import-then-persist step again
const load = async () => {
  jest.resetModules()
  const AsyncStorage = require('@react-native-async-storage/async-storage')
  await AsyncStorage.setItem('persist:root', LEGACY_ROOT)
  return {
    AsyncStorage,
    React: require('react'),
    ErrorBoundary: require('react-error-boundary').ErrorBoundary,
    renderer: require('react-test-renderer'),
    ...require('../persistence'),
  }
}

// Steps the persist write timer and the promises around it
const settle = () => jest.advanceTimersByTimeAsync(100)

type Loaded = Awaited<ReturnType<typeof load>>

// The app root as index.js mounts it, with plain host elements in place of
// the error screen and the app
const mount = ({
  React,
  ErrorBoundary,
  renderer,
  LegacyImportGate,
  resetAfterError,
}: Loaded) => {
  let resetErrorBoundary = () => {}
  let root: { toJSON: () => unknown } | undefined
  renderer.act(() => {
    root = renderer.create(
      React.createElement(
        ErrorBoundary,
        {
          onReset: resetAfterError,
          fallbackRender: (props: { resetErrorBoundary: () => void }) => {
            resetErrorBoundary = props.resetErrorBoundary
            return React.createElement('error-screen')
          },
        },
        React.createElement(LegacyImportGate, null, React.createElement('app')),
      ),
    )
  })
  return {
    shown: () => (root?.toJSON() as { type: string } | null)?.type,
    retry: () => renderer.act(() => resetErrorBoundary()),
  }
}

let consoleError: jest.SpyInstance

beforeEach(() => {
  jest.useFakeTimers()
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  mockImportLegacyState.mockReset()
  // The failed import and the error boundary both log
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
  jest.useRealTimers()
})

describe('persistence', () => {
  it('rehydrates and opens the app after the legacy import succeeds', async () => {
    mockImportLegacyState.mockResolvedValue(undefined)

    const loaded = await load()
    await settle()

    expect(loaded.persistor.getState().bootstrapped).toBe(true)
    expect(mount(loaded).shown()).toBe('app')
  })

  it('rehydrates, keeps persist:root and shows an error after the legacy import fails', async () => {
    const error = new Error('import failed')
    mockImportLegacyState.mockRejectedValue(error)

    const loaded = await load()
    await settle()

    expect(loaded.persistor.getState().bootstrapped).toBe(true)
    expect(await loaded.AsyncStorage.getItem('persist:root')).toBe(LEGACY_ROOT)
    expect(consoleError).toHaveBeenCalledWith(
      'Legacy state import failed',
      error,
    )
    expect(mount(loaded).shown()).toBe('error-screen')
  })

  it('opens the app when a retry of a failed legacy import succeeds', async () => {
    mockImportLegacyState.mockRejectedValueOnce(new Error('import failed'))
    const loaded = await load()
    await settle()
    const app = mount(loaded)
    expect(app.shown()).toBe('error-screen')
    const persist = jest.spyOn(loaded.persistor, 'persist')
    mockImportLegacyState.mockResolvedValueOnce(undefined)

    app.retry()
    await loaded.renderer.act(settle)

    expect(mockImportLegacyState).toHaveBeenCalledTimes(2)
    expect(app.shown()).toBe('app')
    expect(persist).not.toHaveBeenCalled()
  })
})

export {}
