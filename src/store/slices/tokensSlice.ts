import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type Token = {
  mint: string
  symbol: string
  img: string
  name: string
}

export type TokensState = {
  tokens: Record<string, Token>
}

const initialState: TokensState = {
  tokens: {},
}

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<Token>) => {
      state.tokens[action.payload.mint] = action.payload
    },
  },
})

const { reducer, name } = tokensSlice
export { name, tokensSlice }
export default reducer
