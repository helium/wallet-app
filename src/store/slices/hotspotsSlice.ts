import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CSAccount } from '../../storage/cloudStorage'

export type HotspotDetails = {
  pendingIotRewards: number
  pendingMobileRewards: number
}

export type WalletHotspots = {
  hotspots: Record<string, HotspotDetails>
}

export type HotspotsState = Record<string, WalletHotspots>

const initialState: HotspotsState = {}

const hotspots = createSlice({
  name: 'hotspots',
  initialState,
  reducers: {
    updateHotspot: (
      state,
      action: PayloadAction<{
        account: CSAccount
        hotspotDetails: HotspotDetails & { hotspotId: string }
      }>,
    ) => {
      const { solanaAddress } = action.payload.account

      if (!solanaAddress) {
        throw new Error('Solana address missing')
      }

      const prev = state[solanaAddress] || {
        hotspots: {},
      }

      prev.hotspots[action.payload.hotspotDetails.hotspotId] = {
        pendingIotRewards: action.payload.hotspotDetails.pendingIotRewards,
        pendingMobileRewards:
          action.payload.hotspotDetails.pendingMobileRewards,
      }

      state[solanaAddress] = prev
    },
    resetHotspots: (state, action: PayloadAction<CSAccount>) => {
      const { solanaAddress } = action.payload

      if (!solanaAddress) {
        throw new Error('Solana address missing')
      }

      state[solanaAddress] = {
        hotspots: {},
      }
    },
  },
})

const { reducer, name } = hotspots
export { name, hotspots }
export default reducer
