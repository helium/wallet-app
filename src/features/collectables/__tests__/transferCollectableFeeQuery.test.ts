import { AnchorProvider } from '@anchor-lang/core'
import { PublicKey } from '@solana/web3.js'
import { createQueryClient } from '../../../utils/queryClient'
import { createTransferCollectableMessage } from '../../../utils/solanaUtils'
import { transferCollectableFeeQuery } from '../transferCollectableFeeQuery'

jest.mock('../../../utils/solanaUtils', () => ({
  createTransferCollectableMessage: jest.fn(),
}))
jest.mock('../../../utils/logger', () => ({ error: jest.fn() }))

const walletA = 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4'
const walletB = '7Hxp2mJmqXvVnvoTWDBBdpPLhLVNHH8jVTRbYtQ2Nyp5'

const provider = (
  rpcEndpoint: string,
  wallet: string,
  connection: Partial<AnchorProvider['connection']> = {},
) =>
  ({
    connection: { rpcEndpoint, ...connection },
    publicKey: new PublicKey(wallet),
  } as unknown as AnchorProvider)

const base = {
  anchorProvider: provider('https://rpc-a', walletA),
  solanaAddress: walletA,
  heliumAddress: '13M8dUbxymE3xtiAXszRkGMmezMhBS8Li7wEsMojLdb4Sdxc4wc',
  collectable: { id: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux' },
}

describe('transferCollectableFeeQuery', () => {
  it('gives the same inputs the same key', () => {
    expect(transferCollectableFeeQuery({ ...base }).queryKey).toEqual(
      transferCollectableFeeQuery(base).queryKey,
    )
  })

  it.each([
    ['rpc endpoint', { anchorProvider: provider('https://rpc-b', walletA) }],
    ['provider wallet', { anchorProvider: provider('https://rpc-a', walletB) }],
    ['wallet', { solanaAddress: walletB }],
    ['helium address', { heliumAddress: '' }],
    [
      'compressed collectable',
      { collectable: { id: 'dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm' } },
    ],
  ])('keys a changed %s apart', (_, change) => {
    expect(
      transferCollectableFeeQuery({ ...base, ...change }).queryKey,
    ).not.toEqual(transferCollectableFeeQuery(base).queryKey)
  })

  it('keys a changed collectable mint apart', () => {
    const mint = (address: string) =>
      transferCollectableFeeQuery({ ...base, collectable: { address } })
        .queryKey

    expect(mint('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux')).not.toEqual(
      mint('dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm'),
    )
  })

  it('waits for a provider and a wallet', () => {
    expect(transferCollectableFeeQuery(base).enabled).toBe(true)
    expect(
      transferCollectableFeeQuery({ ...base, anchorProvider: undefined })
        .enabled,
    ).toBe(false)
    expect(
      transferCollectableFeeQuery({ ...base, solanaAddress: undefined })
        .enabled,
    ).toBe(false)
  })

  it('waits for an account with no Solana address', () => {
    const anchorProvider = {
      connection: { rpcEndpoint: 'https://rpc-a' },
      publicKey: undefined,
    } as unknown as AnchorProvider
    const build = () =>
      transferCollectableFeeQuery({
        ...base,
        anchorProvider,
        solanaAddress: undefined,
      })

    expect(build).not.toThrow()
    expect(build().enabled).toBe(false)
  })

  it('fails the read when the balance read fails', async () => {
    jest
      .mocked(createTransferCollectableMessage)
      .mockResolvedValue({ message: {} } as never)
    const anchorProvider = provider('https://rpc-a', walletA, {
      getFeeForMessage: jest.fn(async () => ({ value: 5000 })),
      getBalance: jest.fn(async () => {
        throw new Error('rpc down')
      }),
    } as never)
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(
        transferCollectableFeeQuery({ ...base, anchorProvider }),
      ),
    ).rejects.toThrow('rpc down')
    queryClient.clear()
  })

  it('reads the fee and the wallet balance in lamports', async () => {
    jest
      .mocked(createTransferCollectableMessage)
      .mockResolvedValue({ message: {} } as never)
    const anchorProvider = provider('https://rpc-a', walletA, {
      getFeeForMessage: jest.fn(async () => ({ value: 5000 })),
      getBalance: jest.fn(async () => 4000),
    } as never)
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(
        transferCollectableFeeQuery({ ...base, anchorProvider }),
      ),
    ).resolves.toEqual({ feeLamports: 5000, balanceLamports: 4000 })
    queryClient.clear()
  })
})
