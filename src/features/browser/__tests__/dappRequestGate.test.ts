import { RequestSender, RequestSlots, runOneRequest } from '../dappRequestGate'

const idleSlots = (): RequestSlots => ({ topFrame: false, otherFrame: false })

// A request whose run stays open until the test finishes it
const openRequest = (slots: RequestSlots, sender: RequestSender) => {
  let finish = () => {}
  const run = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const decline = jest.fn()
  const done = runOneRequest(slots, sender, decline, run)
  return { run, decline, done, finish: () => finish() }
}

describe('runOneRequest', () => {
  it('declines a request that arrives while another is pending', async () => {
    const slots = idleSlots()
    const first = openRequest(slots, 'topFrame')

    const second = jest.fn(async () => {})
    const declineSecond = jest.fn()
    await runOneRequest(slots, 'topFrame', declineSecond, second)

    expect(declineSecond).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()

    first.finish()
    await first.done
    expect(first.decline).not.toHaveBeenCalled()
    expect(openRequest(slots, 'topFrame').run).toHaveBeenCalled()
  })

  it('runs the next request after the pending one fails', async () => {
    const slots = idleSlots()
    await expect(
      runOneRequest(slots, 'topFrame', jest.fn(), async () => {
        throw new Error('failed')
      }),
    ).rejects.toThrow('failed')

    const next = jest.fn(async () => {})
    const decline = jest.fn()
    await runOneRequest(slots, 'topFrame', decline, next)
    expect(next).toHaveBeenCalled()
    expect(decline).not.toHaveBeenCalled()
  })

  it('runs a top-frame request while another frame holds a request', () => {
    const slots = idleSlots()
    const frame = openRequest(slots, 'otherFrame')
    const top = openRequest(slots, 'topFrame')

    expect(frame.run).toHaveBeenCalled()
    expect(top.run).toHaveBeenCalled()
    expect(top.decline).not.toHaveBeenCalled()
  })

  it('declines another frame while any request is pending', async () => {
    const slots = idleSlots()
    const top = openRequest(slots, 'topFrame')
    const frameDuringTop = openRequest(slots, 'otherFrame')
    expect(frameDuringTop.decline).toHaveBeenCalledTimes(1)
    expect(frameDuringTop.run).not.toHaveBeenCalled()
    top.finish()
    await top.done

    const frame = openRequest(slots, 'otherFrame')
    expect(frame.run).toHaveBeenCalled()
    const frameDuringFrame = openRequest(slots, 'otherFrame')
    expect(frameDuringFrame.decline).toHaveBeenCalledTimes(1)
    expect(frameDuringFrame.run).not.toHaveBeenCalled()
  })

  it('keeps the top-frame slot when the request it superseded ends', async () => {
    const slots = idleSlots()
    const frame = openRequest(slots, 'otherFrame')
    const top = openRequest(slots, 'topFrame')

    frame.finish()
    await frame.done
    expect(openRequest(slots, 'otherFrame').decline).toHaveBeenCalledTimes(1)
    expect(openRequest(slots, 'topFrame').decline).toHaveBeenCalledTimes(1)

    top.finish()
    await top.done
    expect(openRequest(slots, 'otherFrame').run).toHaveBeenCalled()
  })

  it('keeps another frame pending after a top-frame request ends', async () => {
    const slots = idleSlots()
    openRequest(slots, 'otherFrame')
    const top = openRequest(slots, 'topFrame')

    top.finish()
    await top.done
    expect(openRequest(slots, 'otherFrame').decline).toHaveBeenCalledTimes(1)
  })
})
