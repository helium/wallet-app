import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster } from '@solana/web3.js'

export type AppState = {
  showConnectedWallets: boolean
  showBanner: boolean
  cluster?: Cluster
  currentService: 'wallet' | 'governance' | 'hotspots' | 'settings'
}

const initialState: AppState = {
  showConnectedWallets: false,
  showBanner: true,
  currentService: 'wallet',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentService: (
      state,
      action: PayloadAction<AppState['currentService']>,
    ) => {
      state.currentService = action.payload
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
