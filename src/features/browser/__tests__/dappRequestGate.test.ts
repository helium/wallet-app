import { runOneRequest } from '../dappRequestGate'

describe('runOneRequest', () => {
  it('declines a request that arrives while another is pending', async () => {
    const pending = { current: false }
    let finishFirst = () => {}
    const first = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve
        }),
    )
    const declineFirst = jest.fn()
    const firstDone = runOneRequest(pending, declineFirst, first)

    const second = jest.fn(async () => {})
    const declineSecond = jest.fn()
    await runOneRequest(pending, declineSecond, second)

    expect(declineSecond).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()

    finishFirst()
    await firstDone
    expect(declineFirst).not.toHaveBeenCalled()
    expect(pending.current).toBe(false)
  })

  it('runs the next request after the pending one fails', async () => {
    const pending = { current: false }
    await expect(
      runOneRequest(pending, jest.fn(), async () => {
        throw new Error('failed')
      }),
    ).rejects.toThrow('failed')

    const next = jest.fn(async () => {})
    const decline = jest.fn()
    await runOneRequest(pending, decline, next)
    expect(next).toHaveBeenCalled()
    expect(decline).not.toHaveBeenCalled()
  })
})
