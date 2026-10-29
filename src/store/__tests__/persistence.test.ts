const mockPersist = jest.fn()
const mockImportLegacyState = jest.fn()

jest.mock('../store', () => ({ __esModule: true, default: {} }))
jest.mock('redux-persist', () => ({
  persistStore: () => ({ persist: mockPersist }),
}))
jest.mock('../../storage/importLegacyState', () => ({
  importLegacyState: () => mockImportLegacyState(),
}))

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

// Fresh module per case, so each case runs the import-then-persist step again
/* eslint-disable global-require */
const load = () => require('../persistence')
/* eslint-enable global-require */

beforeEach(() => {
  jest.resetModules()
  mockPersist.mockReset()
  mockImportLegacyState.mockReset()
})

describe('persistence', () => {
  it('rehydrates after the legacy import succeeds', async () => {
    mockImportLegacyState.mockResolvedValue(undefined)

    load()
    await flushPromises()

    expect(mockPersist).toHaveBeenCalledTimes(1)
  })

  it('does not rehydrate after the legacy import fails', async () => {
    const error = new Error('import failed')
    mockImportLegacyState.mockRejectedValue(error)
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    load()
    await flushPromises()

    expect(mockPersist).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      'Legacy state import failed',
      error,
    )
    consoleError.mockRestore()
  })
})

export {}
