import { useSelector } from 'react-redux'
import { useCallback } from 'react'
import { RootState } from '../store/rootReducer'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { BrowserDetails, browserSlice } from '../store/slices/browserSlice'
import { useAppDispatch } from '../store/store'

const useBrowser = (): BrowserDetails & {
  addFavorite: (favorite: string) => void
  removeFavorite: (favorite: string) => void
  addRecent: (recent: string) => void
} => {
  const appDispatch = useAppDispatch()
  const { currentAccount } = useAccountStorage()
  const browser = useSelector((state: RootState) => state.browser)

  const addFavorite = useCallback(
    (favorite: string) => {
      if (!currentAccount?.solanaAddress) {
        return
      }

      appDispatch(
        browserSlice.actions.addFavorite({ account: currentAccount, favorite }),
      )
    },
    [appDispatch, currentAccount],
  )

  const removeFavorite = useCallback(
    (favorite: string) => {
      if (!currentAccount?.solanaAddress) {
        return
      }

      appDispatch(
        browserSlice.actions.removeFavorite({
          account: currentAccount,
          favorite,
        }),
      )
    },
    [appDispatch, currentAccount],
  )

  const addRecent = useCallback(
    (recent: string) => {
      if (!currentAccount?.solanaAddress) {
        return
      }

      appDispatch(
        browserSlice.actions.addRecent({ account: currentAccount, recent }),
      )
    },
    [appDispatch, currentAccount],
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
