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
})
