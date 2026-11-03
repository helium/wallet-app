import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import OnboardingProvider, { useOnboarding } from '../OnboardingProvider'

const mockGetMakers = jest.fn()

jest.mock('@helium/onboarding', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getMakers: mockGetMakers })),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const maker = { id: 1, name: 'Maker', address: 'maker-address' }

// Mounts the provider and returns the makers the hook exposes once the
// makers request settles.
const renderMakers = async () => {
  let makers: unknown
  const Probe = () => {
    makers = useOnboarding().makers
    return null
  }
  await act(async () => {
    TestRenderer.create(
      <OnboardingProvider baseUrl="https://onboarding.test">
        <Probe />
      </OnboardingProvider>,
    )
  })
  return makers
}

describe('OnboardingProvider makers', () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    mockGetMakers.mockReset()
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('keeps no makers when the client resolves no response', async () => {
    // On a network error the client resolves the error's response body.
    mockGetMakers.mockResolvedValue(undefined)

    expect(await renderMakers()).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  it('exposes the makers the client returns', async () => {
    mockGetMakers.mockResolvedValue({ data: [maker] })

    expect(await renderMakers()).toEqual([maker])
  })

  it('warns and keeps no makers when the request rejects', async () => {
    const error = new Error('Network Error')
    mockGetMakers.mockRejectedValue(error)

    expect(await renderMakers()).toEqual([])
    expect(warn).toHaveBeenCalledWith('Failed to load makers', error)
  })
})
