import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as web3 from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccount,
} from '@solana/spl-token'
import { getKeypair } from '../../storage/secureStorage'
import { CSAccount } from '../../storage/cloudStorage'

type Balances = {
  hntBalance?: web3.TokenAmount
  dcBalance?: web3.TokenAmount
  mobileBalance?: web3.TokenAmount
}
export type SolanaState = {
  accountBalances: Record<string, Balances>
}
const initialState: SolanaState = { accountBalances: {} }

const connection = new web3.Connection(web3.clusterApiUrl('devnet'))

const Mint = {
  HNT: new web3.PublicKey('hntg4GdrpMBW8bqs4R2om4stE6uScPRhPKWAarzoWKP'),
  MOBILE: new web3.PublicKey('mob1r1x3raXXoH42RZwxTxgbAuKkBQzTAQqSjkUdZbd'),
  DC: new web3.PublicKey('dcr5SHHfQixyb5YT7J1hgbWvgxvBpn65bpCyx6pTiKo'),
} as const

export const requestAirdrop = createAsyncThunk(
  'solana/airdrop',
  async (acct?: CSAccount) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    const key = new web3.PublicKey(acct.solanaAddress)
    return connection.requestAirdrop(key, web3.LAMPORTS_PER_SOL)
  },
)

export const readBalances = createAsyncThunk(
  'solana/readBalance',
  async (acct?: CSAccount) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    const account = new web3.PublicKey(acct.solanaAddress)
    const secureAcct = await getKeypair(acct.address)

    const signer = {
      publicKey: account,
      // If this account has been restored from iCloud, we may not have a secret key
      // If they already have an ata, we won't need signer, so it's ok that it's invalid
      secretKey: secureAcct?.privateKey || Buffer.from([]),
    }

    // Who should the owner be?
    const ata = await createAssociatedTokenAccount(
      connection, // connection
      signer, // fee payer
      Mint.HNT, // mint
      account, // owner,
    )
    // eslint-disable-next-line no-console
    console.log({ ata })

    const hntAta = getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      Mint.HNT,
      account,
      true,
      undefined,
      undefined,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
    )

    const mobileAta = getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      Mint.MOBILE,
      account,
      true,
      undefined,
      undefined,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
    )

    const dcAta = getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      Mint.DC,
      account,
      true,
      undefined,
      undefined,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
    )

    const atas = await Promise.all([hntAta, mobileAta, dcAta])

    const hntBalance = connection.getTokenAccountBalance(atas[0].mint)
    const mobileBalance = connection.getTokenAccountBalance(atas[1].mint)
    const dcBalance = connection.getTokenAccountBalance(atas[2].mint)

    const balances = await Promise.all([hntBalance, mobileBalance, dcBalance])

    return {
      hntBalance: balances[0].value,
      mobileBalance: balances[1].value,
      dcBalance: balances[2].value,
    }
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(readBalances.fulfilled, (state, action) => {
      if (!action.meta.arg?.solanaAddress) return state

      state.accountBalances[action.meta.arg?.solanaAddress] = action.payload
    })
    builder.addCase(readBalances.rejected, (_, action) => {
      console.error(action.error)
    })
  },
})

const { reducer, name } = solanaSlice
export { name }
export default reducer
