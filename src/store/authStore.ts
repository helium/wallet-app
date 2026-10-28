import { create } from 'zustand'

type AuthState = {
  apiToken?: string
}

// Not persisted: the token's stored copy is the walletApiToken secure store item.
export const useAuthStore = create<AuthState>()(() => ({}))
