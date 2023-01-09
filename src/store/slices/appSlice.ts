import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AppState = {
  showCollectablesTabBar: boolean
  showConnectedWallets: boolean
}

const initialState: AppState = {
  showCollectablesTabBar: true,
  showConnectedWallets: false,
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
  },
})

const { reducer, name } = appSlice
export { name, appSlice }
export default reducer
