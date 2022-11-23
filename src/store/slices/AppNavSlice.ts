import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AppNavState = {
  showNavBar: boolean
}

const initialState: AppNavState = { showNavBar: true }

const appNavSlice = createSlice({
  name: 'appNav',
  initialState,
  reducers: {
    setShowNavBar: (state, action: PayloadAction<boolean>) => {
      state.showNavBar = action.payload
    },
  },
})

const { reducer, name } = appNavSlice
export { name, appNavSlice }
export default reducer
