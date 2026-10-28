import { fetchSolanaStatus } from '../useSolanaStatus'

const status = {
  migrationStatus: 'complete',
  minimumVersions: { 'com.helium.wallet.app': '2.15.0' },
  treasuryWarning: false,
}

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock
})

describe('fetchSolanaStatus', () => {
  it('returns the status body from solana-status.helium.com', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => status })

    await expect(fetchSolanaStatus()).resolves.toEqual(status)
    expect(fetchMock).toHaveBeenCalledWith('https://solana-status.helium.com/')
  })

  it('rejects on an HTTP error so the query has no data', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    })

    await expect(fetchSolanaStatus()).rejects.toThrow('503')
  })
})
