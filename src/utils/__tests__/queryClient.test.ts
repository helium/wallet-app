import { createQueryClient } from '../queryClient'

afterEach(() => {
  jest.useRealTimers()
})

describe('createQueryClient', () => {
  it('serves a repeat read from cache for 30 seconds, then refetches', async () => {
    jest.useFakeTimers()
    const queryClient = createQueryClient()
    const queryFn = jest.fn().mockResolvedValue(1)
    const read = () => queryClient.fetchQuery({ queryKey: ['read'], queryFn })

    await read()
    jest.advanceTimersByTime(29_000)
    await read()
    expect(queryFn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(2_000)
    await read()
    expect(queryFn).toHaveBeenCalledTimes(2)

    queryClient.clear()
  })

  it('keeps an unobserved collectables query in memory for 7 days', () => {
    jest.useFakeTimers()
    const queryClient = createQueryClient()
    const collectablesKey = ['collectables', 'mainnet-beta', 'wallet']
    queryClient.setQueryData(collectablesKey, {})

    jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 - 1)
    expect(queryClient.getQueryData(collectablesKey)).toEqual({})

    jest.advanceTimersByTime(1)
    expect(queryClient.getQueryData(collectablesKey)).toBeUndefined()

    queryClient.clear()
  })
  it('keeps an unobserved hotspots query in memory for 7 days', () => {
    jest.useFakeTimers()
    const queryClient = createQueryClient()
    const hotspotsKey = ['hotspots', 'mainnet-beta', 'wallet']
    queryClient.setQueryData(hotspotsKey, {})

    jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 - 1)
    expect(queryClient.getQueryData(hotspotsKey)).toEqual({})

    jest.advanceTimersByTime(1)
    expect(queryClient.getQueryData(hotspotsKey)).toBeUndefined()

    queryClient.clear()
  })
  it('keeps an unobserved balances query in memory for 7 days', () => {
    jest.useFakeTimers()
    const queryClient = createQueryClient()
    const balancesKey = ['balances', 'tokens', 'mainnet-beta', 'wallet']
    queryClient.setQueryData(balancesKey, {})

    jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 - 1)
    expect(queryClient.getQueryData(balancesKey)).toEqual({})

    jest.advanceTimersByTime(1)
    expect(queryClient.getQueryData(balancesKey)).toBeUndefined()

    queryClient.clear()
  })
})
