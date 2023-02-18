import { AnchorProvider } from '@coral-xyz/anchor'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Cluster, PublicKey } from '@solana/web3.js'
import { merge } from 'lodash'
import { CompressedNFT } from 'src/types/solana'
import { CSAccount } from '../../storage/cloudStorage'
import * as solUtils from '../../utils/solanaUtils'
import type { HotspotWithPendingRewards } from '../../utils/solanaUtils'

export type WalletHotspots = {
  hotspots: CompressedNFT[]
  hotspotsWithMeta: HotspotWithPendingRewards[]
  loading: boolean
  fetchingMore: boolean
  onEndReached: boolean
  page: number
}

export type HotspotsState = Record<string, WalletHotspots>

const initialState: HotspotsState = {}

export const fetchHotspots = createAsyncThunk(
  'hotspots/fetchHotspots',
  async ({
    provider,
    account,
    cluster,
    limit = 20,
  }: {
    provider: AnchorProvider
    account: CSAccount
    cluster: Cluster
    limit?: number
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new PublicKey(account.solanaAddress)
    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      cluster,
      0,
      limit,
    )

    const hotspotsWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedHotspots,
    )
    const hotspotsWithPendingRewards =
      await solUtils.annotateWithPendingRewards(provider, hotspotsWithMetadata)

    return {
      fetchedHotspots,
      hotspotsWithMetadata: hotspotsWithPendingRewards,
      page: 0,
      limit,
    }
  },
)

export const fetchMoreHotspots = createAsyncThunk(
  'hotspots/fetchMoreHotspots',
  async ({
    account,
    cluster,
    page = 0,
    provider,
    limit = 20,
  }: {
    account: CSAccount
    cluster: Cluster
    page: number
    provider: AnchorProvider
    limit: number
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new PublicKey(account.solanaAddress)

    // TODO: Add pagination
    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      cluster,
      page + 1,
      limit,
    )

    const hotspotsWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedHotspots,
    )
    const hotspotsWithPendingRewards =
      await solUtils.annotateWithPendingRewards(provider, hotspotsWithMetadata)

    return {
      fetchedHotspots,
      hotspotsWithMetadata: hotspotsWithPendingRewards,
      page: page + 1,
      limit,
    }
  },
)

const hotspots = createSlice({
  name: 'hotspots',
  initialState,
  reducers: {},
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
        hotspotsWithMeta: [],
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
      const { fetchedHotspots, hotspotsWithMetadata, limit } = action.payload

      const address = action.meta.arg.account.solanaAddress
      const onEndReached = Object.keys(hotspotsWithMetadata).length < limit

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
