import { AnchorProvider } from '@coral-xyz/anchor'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster, PublicKey } from '@solana/web3.js'
import { CompressedNFT, HotspotWithPendingRewards } from 'src/types/solana'
import { CSAccount } from '../../storage/cloudStorage'
import * as solUtils from '../../utils/solanaUtils'

export type WalletHotspots = {
  hotspots: CompressedNFT[]
  hotspotsWithMeta: HotspotWithPendingRewards[]
  loading: boolean
  fetchingMore: boolean
  onEndReached: boolean
  page: number
}

export type HotspotsByWallet = Record<string, WalletHotspots>
export type HotspotsByCluster = Record<Cluster, HotspotsByWallet>

const initialState: HotspotsByCluster = {
  'mainnet-beta': {},
  devnet: {},
  testnet: {},
}

export const fetchHotspots = createAsyncThunk(
  'hotspots/fetchHotspots',
  async ({
    account,
    anchorProvider,
    limit,
    cluster: _cluster,
  }: {
    account: CSAccount
    anchorProvider: AnchorProvider
    cluster: Cluster
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
    cluster: _cluster,
  }: {
    account: CSAccount
    cluster: Cluster
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

const hotspotSlice = createSlice({
  name: 'hotspots',
  initialState,
  reducers: {
    resetState: () => initialState,
    resetLoading: (
      state,
      action: PayloadAction<{ acct: CSAccount; cluster: Cluster }>,
    ) => {
      const { acct, cluster } = action.payload
      if (!acct.solanaAddress) throw new Error('Solana address missing')
      const address = acct.solanaAddress
      if (!state[cluster]) {
        state[cluster] = {}
      }
      state[cluster][address] = { ...state[cluster][address], loading: false }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchHotspots.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const { cluster } = action.meta.arg
      const prev = state[cluster][address] || {
        hotspotsWithMeta: [],
        hotspots: [],
      }
      state[cluster][address] = {
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
      const { cluster } = action.meta.arg
      state[cluster][address] = {
        ...state[cluster][address],
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
      const { cluster } = action.meta.arg
      const prev = state[cluster][address] || {
        hotspotsWithMeta: [],
        hotspots: {},
      }
      state[cluster][address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
      }
    })
    builder.addCase(fetchMoreHotspots.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const { cluster } = action.meta.arg
      const prev = state[cluster][address] || {
        hotspotsWithMeta: [],
        hotspots: [],
      }
      state[cluster][address] = {
        ...prev,
        loading: true,
        fetchingMore: true,
        onEndReached: false,
      }
    })
    builder.addCase(fetchMoreHotspots.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg
      const { fetchedHotspots, hotspotsWithMetadata, limit } = action.payload

      const address = action.meta.arg.account.solanaAddress
      const onEndReached = limit
        ? Object.keys(hotspotsWithMetadata).length < limit
        : true

      state[cluster][address] = {
        ...state[cluster][address],
        hotspots: [...state[cluster][address].hotspots, ...fetchedHotspots],
        hotspotsWithMeta: [
          ...state[cluster][address].hotspotsWithMeta,
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
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        hotspotsWithMeta: [],
        hotspots: [],
      }
      state[cluster][address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
      }
    })
  },
})

const { reducer, name } = hotspotSlice
export { name, hotspotSlice as hotspotsSlice }
export default reducer
