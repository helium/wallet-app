import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CSAccount } from '../../storage/cloudStorage'

export type BrowserDetails = {
  favorites: string[]
  recents: string[]
}

export type BrowserState = Record<string, BrowserDetails>

const initialState: BrowserState = {}

const browserSlice = createSlice({
  name: 'browser',
  initialState,
  reducers: {
    addFavorite: (
      state,
      action: PayloadAction<{
        account: CSAccount
        favorite: string
      }>,
    ) => {
      const { solanaAddress } = action.payload.account

      if (!solanaAddress) {
        throw new Error('Solana address missing')
      }

      const { favorite } = action.payload

      if (!state[solanaAddress]) {
        state[solanaAddress] = {
          favorites: [favorite],
          recents: [],
        }
        return
      }

      state[solanaAddress].favorites = [
        ...state[solanaAddress].favorites,
        favorite,
      ]
    },
    removeFavorite: (
      state,
      action: PayloadAction<{
        account: CSAccount
        favorite: string
      }>,
    ) => {
      const { solanaAddress } = action.payload.account

      if (!solanaAddress) {
        throw new Error('Solana address missing')
      }

      state[solanaAddress].favorites = state[solanaAddress].favorites.filter(
        (f) => f !== action.payload.favorite,
      )
    },
    addRecent: (
      state,
      action: PayloadAction<{
        account: CSAccount
        recent: string
      }>,
    ) => {
      const { solanaAddress } = action.payload.account

      if (!solanaAddress) {
        throw new Error('Solana address missing')
      }
      const { recent } = action.payload

      if (!state[solanaAddress]) {
        state[solanaAddress] = {
          favorites: [],
          recents: [recent],
        }
        return
      }

      // Dont add duplicates
      if (state[solanaAddress].recents.includes(recent)) {
        return
      }

      // Limit to only 10 recents. We can increase this later if needed.
      if (state[solanaAddress].recents.length >= 10) {
        state[solanaAddress].recents = state[solanaAddress].recents.slice(1)
      }

      state[solanaAddress].recents = [...state[solanaAddress].recents, recent]
    },
  },
})

const { reducer, name } = browserSlice
export { name, browserSlice }
export default reducer
