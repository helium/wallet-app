import { AccountLayout, AccountState } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { decodeTokenAccount } from '../tokenAccounts'

const HNT_MINT = new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux')
const OWNER = new PublicKey('11111111111111111111111111111111')

const encodeAccount = (args: {
  mint: PublicKey
  amount: bigint
  state: AccountState
}): Buffer => {
  const data = Buffer.alloc(AccountLayout.span)
  AccountLayout.encode(
    {
      mint: args.mint,
      owner: OWNER,
      amount: args.amount,
      delegateOption: 0,
      delegate: PublicKey.default,
      delegatedAmount: BigInt(0),
      state: args.state,
      isNativeOption: 0,
      isNative: BigInt(0),
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    data,
  )
  return data
}

describe('decodeTokenAccount', () => {
  it('reads a frozen account as frozen', () => {
    const decoded = decodeTokenAccount(
      encodeAccount({
        mint: HNT_MINT,
        amount: BigInt(500),
        state: AccountState.Frozen,
      }),
    )

    expect(decoded.frozen).toBe(true)
  })

  it('reads an initialized account as not frozen', () => {
    const decoded = decodeTokenAccount(
      encodeAccount({
        mint: HNT_MINT,
        amount: BigInt(500),
        state: AccountState.Initialized,
      }),
    )

    expect(decoded.frozen).toBe(false)
  })

  it('reads the mint and raw amount', () => {
    const decoded = decodeTokenAccount(
      encodeAccount({
        mint: HNT_MINT,
        amount: BigInt(12345678),
        state: AccountState.Initialized,
      }),
    )

    expect(decoded.mint.toBase58()).toBe(
      'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
    )
    expect(decoded.amount).toBe(BigInt(12345678))
  })
})
