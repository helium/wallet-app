import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster, PublicKey } from '@solana/web3.js'
import { merge } from 'lodash'
import { CompressedNFT } from 'src/types/solana'
import { CSAccount } from '../../storage/cloudStorage'
import * as solUtils from '../../utils/solanaUtils'

export type HotspotDetails = {
  pendingIotRewards: number
  pendingMobileRewards: number
}

export type WalletHotspots = {
  hotspotDetails: Record<string, HotspotDetails>
  hotspots: CompressedNFT[]
  hotspotsWithMeta: CompressedNFT[]
  loading: boolean
  fetchingMore: boolean
  onEndReached: boolean
  page: number
}

export type HotspotsState = Record<string, WalletHotspots>

const initialState: HotspotsState = {}

export const fetchHotspots = createAsyncThunk(
  'hotspots/fetchHotspots',
  async ({ account, cluster }: { account: CSAccount; cluster: Cluster }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new PublicKey(account.solanaAddress)
    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      cluster,
    )

    const hotspotsWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedHotspots,
    )

    return {
      fetchedHotspots,
      hotspotsWithMetadata,
      page: 0,
    }
  },
)

export const fetchMoreHotspots = createAsyncThunk(
  'hotspots/fetchMoreHotspots',
  async ({
    account,
    cluster,
    page = 0,
  }: {
    account: CSAccount
    cluster: Cluster
    page: number
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new PublicKey(account.solanaAddress)

    // TODO: Add pagination
    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      cluster,
    )

    const hotspotsWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedHotspots,
    )
    return {
      fetchedHotspots,
      hotspotsWithMetadata,
      page,
    }
  },
)

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

      const prev = state[solanaAddress]?.hotspotDetails
        ? state[solanaAddress].hotspotDetails
        : ({} as Record<string, HotspotDetails>)

      prev[action.payload.hotspotDetails.hotspotId] = {
        pendingIotRewards: action.payload.hotspotDetails.pendingIotRewards,
        pendingMobileRewards:
          action.payload.hotspotDetails.pendingMobileRewards,
      }

      state[solanaAddress] = {
        ...state[solanaAddress],
        hotspotDetails: prev,
      }
    },
    resetHotspots: (state, action: PayloadAction<CSAccount>) => {
      const { solanaAddress } = action.payload

      if (!solanaAddress) {
        throw new Error('Solana address missing')
      }

      state[solanaAddress] = {
        ...state[solanaAddress],
        hotspotDetails: {},
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchHotspots.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        hotspotsWithMeta: [],
        hotspots: [],
      }
      state[address] = {
        ...prev,
        loading: true,
        fetchingMore: false,
        onEndReached: false,
      }
    })
    builder.addCase(fetchHotspots.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { fetchedHotspots, hotspotsWithMetadata } = action.payload

      const address = action.meta.arg.account.solanaAddress
      state[address] = {
        ...state[address],
        hotspots: fetchedHotspots,
        hotspotsWithMeta: hotspotsWithMetadata,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
        page: action.payload.page,
      }
    })
    builder.addCase(fetchHotspots.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        hotspotsWithMeta: {},
        hotspots: {},
      }
      state[address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
      }
    })
    builder.addCase(fetchMoreHotspots.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        hotspotsWithMeta: [],
        hotspots: [],
      }
      state[address] = {
        ...prev,
        loading: true,
        fetchingMore: true,
        onEndReached: false,
      }
    })
    builder.addCase(fetchMoreHotspots.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { fetchedHotspots, hotspotsWithMetadata } = action.payload

      const address = action.meta.arg.account.solanaAddress
      const onEndReached = Object.keys(hotspotsWithMetadata).length === 0

      state[address] = {
        ...state[address],
        hotspots: merge(fetchedHotspots, state[address].hotspots),
        hotspotsWithMeta: merge(
          hotspotsWithMetadata,
          state[address].hotspotsWithMeta,
        ),
        loading: false,
        fetchingMore: false,
        onEndReached,
        page: action.payload.page,
      }
    })
    builder.addCase(fetchMoreHotspots.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        hotspotsWithMeta: [],
        hotspots: [],
      }
      state[address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
      }
    })
  },
})

const { reducer, name } = hotspots
export { name, hotspots }
export default reducer
