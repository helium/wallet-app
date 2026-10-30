import { Connection, PublicKey } from '@solana/web3.js'
import { ataCreationFeeQuery } from '../ataCreationFeeQuery'

jest.mock('../../../../utils/solanaUtils', () => ({
  getAtaAccountCreationFee: jest.fn(),
}))

const connection = (rpcEndpoint: string) => ({ rpcEndpoint } as Connection)
const base = {
  connection: connection('https://rpc-a'),
  solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
  mint: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
}

describe('ataCreationFeeQuery', () => {
  it('gives the same inputs the same key', () => {
    expect(ataCreationFeeQuery({ ...base }).queryKey).toEqual(
      ataCreationFeeQuery(base).queryKey,
    )
  })

  it.each([
    ['rpc endpoint', { connection: connection('https://rpc-b') }],
    [
      'wallet',
      { solanaAddress: '7Hxp2mJmqXvVnvoTWDBBdpPLhLVNHH8jVTRbYtQ2Nyp5' },
    ],
    [
      'output mint',
      { mint: new PublicKey('dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm') },
    ],
  ])('keys a changed %s apart', (_, change) => {
    expect(ataCreationFeeQuery({ ...base, ...change }).queryKey).not.toEqual(
      ataCreationFeeQuery(base).queryKey,
    )
  })

  it('waits for a connection and a wallet', () => {
    expect(ataCreationFeeQuery(base).enabled).toBe(true)
    expect(
      ataCreationFeeQuery({ ...base, connection: undefined }).enabled,
    ).toBe(false)
    expect(
      ataCreationFeeQuery({ ...base, solanaAddress: undefined }).enabled,
    ).toBe(false)
  })
})
