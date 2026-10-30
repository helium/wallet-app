import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CSAccount, CSAccounts, CSToken } from '../storage/cloudStorage'
import { mmkvStateStorage } from '../storage/mmkv'

// The five keys that iOS kept in iCloud and Android in AsyncStorage.
export type CloudState = {
  accounts?: CSAccounts
  contacts?: CSAccount[]
  lastViewedNotifications?: number
  visibleTokens?: CSToken
  defaultAccountAddress?: string
}

export const useCloudStore = create<CloudState>()(
  persist(() => ({}), {
    name: 'cloud',
    storage: createJSONStorage(() => mmkvStateStorage),
  }),
)
