import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AppState = {
  showCollectablesTabBar: boolean
}

const initialState: AppState = {
  showCollectablesTabBar: true,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCollectablesTabBar: (state, action: PayloadAction<boolean>) => {
      state.showCollectablesTabBar = action.payload
    },
  },
})

const { reducer, name } = appSlice
export { name, appSlice }
export default reducer
