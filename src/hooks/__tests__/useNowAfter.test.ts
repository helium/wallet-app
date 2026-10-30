import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import useNowAfter from '../useNowAfter'

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const MOUNT_MS = 1_700_000_000_000

const renderNowAfter = (endTsSeconds?: number) => {
  const result: { now?: number } = {}
  const Probe = () => {
    result.now = useNowAfter(endTsSeconds)
    return null
  }
  act(() => {
    TestRenderer.create(React.createElement(Probe))
  })
  return result
}

describe('useNowAfter', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: MOUNT_MS })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns the mount time before the end time', () => {
    const result = renderNowAfter(MOUNT_MS / 1000 + 60)

    act(() => {
      jest.advanceTimersByTime(59_000)
    })

    expect(result.now).toBe(MOUNT_MS)
  })

  it('returns a later time once the end time passes', () => {
    const result = renderNowAfter(MOUNT_MS / 1000 + 60)

    act(() => {
      jest.advanceTimersByTime(61_000)
    })

    expect(result.now).toBeGreaterThanOrEqual(MOUNT_MS + 60_000)
  })

  it('schedules no timer without an end time', () => {
    const result = renderNowAfter(undefined)

    expect(jest.getTimerCount()).toBe(0)
    expect(result.now).toBe(MOUNT_MS)
  })

  it('re-reads the clock after timers run when the end time is past', () => {
    const result = renderNowAfter(MOUNT_MS / 1000 - 60)

    act(() => {
      jest.setSystemTime(MOUNT_MS + 5)
      jest.runOnlyPendingTimers()
    })

    expect(result.now).toBe(MOUNT_MS + 5)
  })
})
