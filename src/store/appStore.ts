import type { Cluster } from '@solana/web3.js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../storage/mmkv'

type AppState = {
  showConnectedWallets: boolean
  showBanner: boolean
  cluster?: Cluster
  setCluster: (cluster: Cluster) => void
  toggleConnectedWallets: () => void
  setShowBanner: (showBanner: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      showConnectedWallets: false,
      showBanner: true,
      setCluster: (cluster) => set({ cluster }),
      toggleConnectedWallets: () =>
        set((state) => ({ showConnectedWallets: !state.showConnectedWallets })),
      setShowBanner: (showBanner) => set({ showBanner }),
    }),
    { name: 'app', storage: createJSONStorage(() => mmkvStateStorage) },
  ),
)
