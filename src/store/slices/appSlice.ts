import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AppState = {
  showCollectablesTabBar: boolean
  showConnectedWallets: boolean
  showBanner: boolean
}

const initialState: AppState = {
  showCollectablesTabBar: true,
  showConnectedWallets: false,
  showBanner: true,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCollectablesTabBar: (state, action: PayloadAction<boolean>) => {
      state.showCollectablesTabBar = action.payload
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
