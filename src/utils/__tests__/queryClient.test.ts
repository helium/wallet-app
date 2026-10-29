import {
  PERSISTED_QUERY_ROOTS,
  createQueryClient,
  removePersistedQueries,
} from '../queryClient'

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

  it.each(PERSISTED_QUERY_ROOTS)(
    'keeps an unobserved %s query in memory for 7 days',
    (root) => {
      jest.useFakeTimers()
      const queryClient = createQueryClient()
      const key = [root, 'mainnet-beta', 'wallet']
      queryClient.setQueryData(key, {})

      jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 - 1)
      expect(queryClient.getQueryData(key)).toEqual({})

      jest.advanceTimersByTime(1)
      expect(queryClient.getQueryData(key)).toBeUndefined()

      queryClient.clear()
    },
  )
})

describe('removePersistedQueries', () => {
  it('removes persisted queries and keeps the others', () => {
    const queryClient = createQueryClient()
    const collectablesKey = ['collectables', 'devnet', 'addr']
    queryClient.setQueryData(collectablesKey, {})
    queryClient.setQueryData(['balance'], 1)

    removePersistedQueries(queryClient)

    expect(queryClient.getQueryData(collectablesKey)).toBeUndefined()
    expect(queryClient.getQueryData(['balance'])).toBe(1)

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
