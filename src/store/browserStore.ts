import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../storage/mmkv'

export type BrowserDetails = {
  favorites: string[]
  recents: string[]
}

type BrowserState = {
  // Keyed by the account's Solana address
  byAccount: Record<string, BrowserDetails>
  addFavorite: (solanaAddress: string, favorite: string) => void
  removeFavorite: (solanaAddress: string, favorite: string) => void
  addRecent: (solanaAddress: string, recent: string) => void
}

const emptyDetails: BrowserDetails = { favorites: [], recents: [] }

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set) => ({
      byAccount: {},
      addFavorite: (solanaAddress, favorite) =>
        set(({ byAccount }) => {
          const details = byAccount[solanaAddress] || emptyDetails
          return {
            byAccount: {
              ...byAccount,
              [solanaAddress]: {
                ...details,
                favorites: [...details.favorites, favorite],
              },
            },
          }
        }),
      removeFavorite: (solanaAddress, favorite) =>
        set(({ byAccount }) => {
          const details = byAccount[solanaAddress]
          if (!details) return {}
          return {
            byAccount: {
              ...byAccount,
              [solanaAddress]: {
                ...details,
                favorites: details.favorites.filter((f) => f !== favorite),
              },
            },
          }
        }),
      addRecent: (solanaAddress, recent) =>
        set(({ byAccount }) => {
          const details = byAccount[solanaAddress] || emptyDetails
          // Dont add duplicates
          if (details.recents.includes(recent)) return {}
          // Limit to only 10 recents. We can increase this later if needed.
          const kept =
            details.recents.length >= 10
              ? details.recents.slice(1)
              : details.recents
          return {
            byAccount: {
              ...byAccount,
              [solanaAddress]: { ...details, recents: [...kept, recent] },
            },
          }
        }),
    }),
    { name: 'browser', storage: createJSONStorage(() => mmkvStateStorage) },
  ),
)
