import { AnchorProvider } from '@coral-xyz/anchor'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey } from '@solana/web3.js'
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
    account,
    anchorProvider,
    limit,
  }: {
    account: CSAccount
    anchorProvider: AnchorProvider
    limit?: number
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new PublicKey(account.solanaAddress)
    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      anchorProvider,
      1,
      limit,
    )

    const hotspotsWithMetadata = await solUtils.getCompressedNFTMetadata(
      fetchedHotspots,
    )
    const hotspotsWithPendingRewards =
      await solUtils.annotateWithPendingRewards(
        anchorProvider,
        hotspotsWithMetadata,
      )

    return {
      fetchedHotspots,
      hotspotsWithMetadata: hotspotsWithPendingRewards,
      page: 1,
      limit,
    }
  },
)

export const fetchMoreHotspots = createAsyncThunk(
  'hotspots/fetchMoreHotspots',
  async ({
    account,
    page = 1,
    provider,
    limit,
  }: {
    account: CSAccount
    page: number
    provider: AnchorProvider
    limit?: number
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new PublicKey(account.solanaAddress)

    // TODO: Add pagination
    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      provider,
      page + 1,
      limit,
    )

    const hotspotsWithMetadata = await solUtils.getCompressedNFTMetadata(
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
  reducers: {
    resetLoading: (state, action: PayloadAction<{ acct: CSAccount }>) => {
      const { acct } = action.payload
      if (!acct.solanaAddress) throw new Error('Solana address missing')
      const address = acct.solanaAddress
      state[address] = { ...state[address], loading: false }
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
      const onEndReached = limit
        ? Object.keys(hotspotsWithMetadata).length < limit
        : true

      state[address] = {
        ...state[address],
        hotspots: [...state[address].hotspots, ...fetchedHotspots],
        hotspotsWithMeta: [
          ...state[address].hotspotsWithMeta,
          ...hotspotsWithMetadata,
        ],
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
