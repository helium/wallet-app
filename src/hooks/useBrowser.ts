import { useCallback } from 'react'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { BrowserDetails, useBrowserStore } from '../store/browserStore'

const useBrowser = (): BrowserDetails & {
  addFavorite: (favorite: string) => void
  removeFavorite: (favorite: string) => void
  addRecent: (recent: string) => void
} => {
  const { currentAccount } = useAccountStorage()
  const browser = useBrowserStore((state) => state.byAccount)
  const storeAddFavorite = useBrowserStore((state) => state.addFavorite)
  const storeRemoveFavorite = useBrowserStore((state) => state.removeFavorite)
  const storeAddRecent = useBrowserStore((state) => state.addRecent)

  const addFavorite = useCallback(
    (favorite: string) => {
      if (!currentAccount?.solanaAddress) {
        return
      }

      storeAddFavorite(currentAccount.solanaAddress, favorite)
    },
    [storeAddFavorite, currentAccount],
  )

  const removeFavorite = useCallback(
    (favorite: string) => {
      if (!currentAccount?.solanaAddress) {
        return
      }

      storeRemoveFavorite(currentAccount.solanaAddress, favorite)
    },
    [storeRemoveFavorite, currentAccount],
  )

  const addRecent = useCallback(
    (recent: string) => {
      if (!currentAccount?.solanaAddress) {
        return
      }

      storeAddRecent(currentAccount.solanaAddress, recent)
    },
    [storeAddRecent, currentAccount],
  )

  if (
    !currentAccount?.solanaAddress ||
    !browser[currentAccount?.solanaAddress]
  ) {
    return {
      recents: [],
      favorites: [],
      addFavorite,
      removeFavorite,
      addRecent,
    }
  }

  return {
    recents: browser[currentAccount?.solanaAddress].recents,
    favorites: browser[currentAccount?.solanaAddress].favorites,
    addFavorite,
    removeFavorite,
    addRecent,
  }
}

export default useBrowser
