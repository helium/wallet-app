import Balance, { AnyCurrencyType } from '@helium/currency'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CSAccount } from '../../storage/cloudStorage'
import * as solUtils from '../../utils/solanaUtils'

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

export const requestAirdrop = createAsyncThunk(
  'solana/airdrop',
  async (acct?: CSAccount) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    return solUtils.airdrop(acct.solanaAddress)
  },
)

export const readBalances = createAsyncThunk(
  'solana/readBalance',
  async (acct?: CSAccount) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    return solUtils.readBalances(acct.solanaAddress)
  },
)

type Payment = {
  payee: string
  balanceAmount: Balance<AnyCurrencyType>
  memo: string
  max?: boolean
}

type PaymentInput = { account: CSAccount; payments: Payment[] }

export const makePayment = createAsyncThunk(
  'solana/makePayment',
  async ({ account, payments }: PaymentInput) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    return solUtils.transferToken(
      account.solanaAddress,
      account.address,
      payments,
    )
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
