import axios from 'axios'

jest.mock('axios')

const mockedGet = axios.get as jest.Mock

const loadFetchCanopyBlacklist = () => {
  let fetchCanopyBlacklist: () => Promise<Set<string>> = async () => new Set()
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ;({ fetchCanopyBlacklist } = require('../canopyBlacklist'))
  })
  return fetchCanopyBlacklist
}

describe('fetchCanopyBlacklist', () => {
  beforeEach(() => {
    mockedGet.mockReset()
  })

  it('returns an empty set on a failed fetch and retries on the next call', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchCanopyBlacklist = loadFetchCanopyBlacklist()
    mockedGet.mockRejectedValueOnce(new Error('network down'))

    await expect(fetchCanopyBlacklist()).resolves.toEqual(new Set())

    mockedGet.mockResolvedValueOnce({ data: { A: 1, B: 2 } })
    await expect(fetchCanopyBlacklist()).resolves.toEqual(new Set(['A', 'B']))
    expect(mockedGet).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('serves later calls from the cache after a successful fetch', async () => {
    const fetchCanopyBlacklist = loadFetchCanopyBlacklist()
    mockedGet.mockResolvedValueOnce({ data: { A: 1, B: 2 } })

    await expect(fetchCanopyBlacklist()).resolves.toEqual(new Set(['A', 'B']))
    await expect(fetchCanopyBlacklist()).resolves.toEqual(new Set(['A', 'B']))
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })
})
