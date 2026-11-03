import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import useStatusPage from '../useStatusPage'

// Runs the appear callback once on mount, as a first focus does.
jest.mock('../../../hooks/useAppear', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect } = require('react')
  const useAppear = (callback: () => void) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => callback(), [])
  }
  return { __esModule: true, default: useAppear }
})

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const Probe = () => {
  useStatusPage()
  return null
}

describe('useStatusPage', () => {
  const realFetch = global.fetch
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warn.mockRestore()
    global.fetch = realFetch
  })

  it('warns when the status requests fail', async () => {
    const error = new Error('Network Error')
    global.fetch = jest.fn(() => Promise.reject(error))

    // The async act flushes the rejected requests and their handlers.
    await act(async () => {
      TestRenderer.create(<Probe />)
    })

    expect(warn).toHaveBeenCalledWith('Failed to load status summary', error)
    expect(warn).toHaveBeenCalledWith('Failed to load status incidents', error)
  })
})
