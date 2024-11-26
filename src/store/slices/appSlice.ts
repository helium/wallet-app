import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster } from '@solana/web3.js'

export type AppState = {
  showBanner: boolean
  cluster?: Cluster
  rootSheetPosition?: number
}

const initialState: AppState = {
  showBanner: true,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCluster: (state, action: PayloadAction<Cluster>) => {
      state.cluster = action.payload
    },
    setShowBanner: (state, action: PayloadAction<boolean>) => {
      state.showBanner = action.payload
    },
    setRootSheetPosition: (
      state,
      action: PayloadAction<number | undefined>,
    ) => {
      state.rootSheetPosition = action.payload
    },
  },
})

const { reducer, name } = appSlice
export { name, appSlice }
export default reducer
