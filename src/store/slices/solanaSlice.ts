import { PayloadAction, SerializedError, createSlice } from '@reduxjs/toolkit'
import { PURGE } from 'redux-persist'

export type SolanaState = {
  payment?: {
    loading?: boolean
    error?: SerializedError
    success?: boolean
    signature?: string
    progress?: { percent: number; text: string } // 0-100
  }
  delegate?: { loading?: boolean; error?: SerializedError; success?: boolean }
}

const initialState: SolanaState = {}

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {
    setPaymentProgress: (
      state,
      action: PayloadAction<{ percent: number; text: string }>,
    ) => {
      if (state.payment) {
        state.payment.progress = action.payload
      }
    },
    resetPayment: (state) => {
      state.payment = {
        success: false,
        loading: false,
        error: undefined,
        signature: undefined,
        progress: undefined,
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
