import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthState = {
  apiToken?: string
}

const initialState: AuthState = {}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setApiToken: (state, action: PayloadAction<string>) => {
      state.apiToken = action.payload
    },
  },
})

const { reducer, name } = authSlice
export { authSlice, name }
export default reducer
