import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as web3 from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token'
import { CSAccount } from '../../storage/cloudStorage'

type Balances = {
  hntBalance?: bigint
  dcBalance?: bigint
  mobileBalance?: bigint
  secBalance?: bigint
  stakedBalance?: bigint
}
export type SolanaState = {
  balances: Record<string, Balances>
}
const initialState: SolanaState = { balances: {} }

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

    const tokenAccounts = await connection.getTokenAccountsByOwner(account, {
      programId: TOKEN_PROGRAM_ID,
    })

    const vals = {} as Record<string, bigint>
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = AccountLayout.decode(tokenAccount.account.data)
      vals[accountData.mint.toBase58()] = accountData.amount
    })

    const retval = {
      hntBalance: vals[Mint.HNT.toBase58()],
      mobileBalance: vals[Mint.MOBILE.toBase58()],
      dcBalance: vals[Mint.DC.toBase58()],
    }
    return retval
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(readBalances.fulfilled, (state, action) => {
      if (!action.meta.arg?.solanaAddress) return state

      state.balances[action.meta.arg?.solanaAddress] = {
        ...action.payload,
      }
    })
    builder.addCase(readBalances.rejected, (_, action) => {
      console.error(action.error)
    })
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
