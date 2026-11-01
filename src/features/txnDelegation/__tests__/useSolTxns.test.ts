import { Message } from '@helium/onboarding'
import { SignHotspotResponse } from '@helium/wallet-link'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { getKeypair, getSolanaKeypair } from '../../../storage/secureStorage'
import useSolTxns from '../useSolTxns'

declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

jest.mock('../../../storage/secureStorage', () => ({
  getKeypair: jest.fn(),
  getSolanaKeypair: jest.fn(),
}))
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: undefined }),
}))
// submit only; sign never reaches it
jest.mock('../../../utils/solanaUtils', () => ({ submitSolana: jest.fn() }))

const configMsgStr = Buffer.from(
  Message.encode(
    Message.fromPartial({
      hmhPubKey: new Uint8Array(32).fill(1),
      azimuth: 90,
      height: 10,
    }),
  ).finish(),
).toString('base64')

const renderHook = async () => {
  let hook: ReturnType<typeof useSolTxns> | undefined
  const Probe = () => {
    hook = useSolTxns({
      heliumAddress: 'heliumAddress',
      deepLinkPath: 'deepLinkPath',
      configMsgStr,
    })
    return null
  }
  await act(async () => {
    TestRenderer.create(React.createElement(Probe))
  })
  if (!hook) throw new Error('render failed')
  return hook
}

describe('useSolTxns sign', () => {
  it('replies token_not_found to the dApp when the helium keypair is missing', async () => {
    ;(getSolanaKeypair as jest.Mock).mockResolvedValue({})
    ;(getKeypair as jest.Mock).mockResolvedValue(undefined)
    const callback = jest.fn((_response: SignHotspotResponse) =>
      Promise.resolve(),
    )

    const { sign } = await renderHook()
    await expect(sign(callback)).rejects.toThrow(
      'Failed to sign configuration message',
    )

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ status: 'token_not_found' })
  })
})
