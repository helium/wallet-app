import Balance, { AnyCurrencyType, Ticker } from '@helium/currency'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CSAccount } from '../../storage/cloudStorage'

const initialState: TokensState = {
  tokens: [],
  visibleTokens: [],
}

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    handleUpdateTokens: (
      state,
      action: PayloadAction<{
        account: CSAccount
        token: Token
        value: boolean
      }>,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { address } = action.payload.account
    },
  },
  extraReducers: () => {},
})

const { reducer, name } = tokensSlice
export { name, tokensSlice }
export default reducer

//
// Utils
//

export type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
  name?: string
  mintAddress?: string
}

export type TokensState = {
  tokens: Token[]
  visibleTokens: Token[]
}
