import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster } from '@solana/web3.js'

export type AppState = {
  showConnectedWallets: boolean
  showBanner: boolean
  theme: 'light' | 'dark' | 'system'
  cluster?: Cluster
}

const initialState: AppState = {
  showConnectedWallets: false,
  showBanner: true,
  theme: 'system',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updateTheme: (
      state,
      action: PayloadAction<'light' | 'dark' | 'system'>,
    ) => {
      state.theme = action.payload
    },
    setCluster: (state, action: PayloadAction<Cluster>) => {
      state.cluster = action.payload
    },
    toggleConnectedWallets: (state) => {
      state.showConnectedWallets = !state.showConnectedWallets
    },
    setShowBanner: (state, action: PayloadAction<boolean>) => {
      state.showBanner = action.payload
    },
  },
})

const { reducer, name } = appSlice
export { name, appSlice }
export default reducer
