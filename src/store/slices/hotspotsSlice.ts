import { AnchorProvider } from '@coral-xyz/anchor'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster, PublicKey } from '@solana/web3.js'
import { CompressedNFT } from 'src/types/solana'
import { DEFAULT_PAGE_AMOUNT } from '../../features/collectables/HotspotList'
import { CSAccount } from '../../storage/cloudStorage'
import * as solUtils from '../../utils/solanaUtils'

export type WalletHotspots = {
  loading: boolean
  fetchingMore: boolean
  onEndReached: boolean
  page: number
  totalHotspots?: number

  hotspotsById: Record<string, CompressedNFT>
  hotspotsMetadataById: Record<string, any>
  hotspotsRewardsById: Record<string, any>
}

export type HotspotsByWallet = Record<string, WalletHotspots>
export type HotspotsByCluster = Record<Cluster, HotspotsByWallet>

const initialState: HotspotsByCluster = {
  'mainnet-beta': {},
  devnet: {},
  testnet: {},
}

export const fetchAllHotspots = createAsyncThunk(
  'hotspots/fetchAllHotspots',
  async ({
    account,
    anchorProvider,
    cluster: _cluster,
  }: {
    account: CSAccount
    anchorProvider: AnchorProvider
    cluster: Cluster
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')
    const pubKey = new PublicKey(account.solanaAddress)
    let fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      anchorProvider,
      1,
      1000,
    )

    let hotspots: CompressedNFT[] = []
    while (hotspots.length < fetchedHotspots.total) {
      hotspots = hotspots.concat(fetchedHotspots.items)
      fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
        pubKey,
        anchorProvider,
        fetchedHotspots.page + 1,
        1000,
      )
    }

    return {
      fetchedHotspots: hotspots,
    }
  },
)

export const fetchHotspots = createAsyncThunk(
  'hotspots/fetchHotspots',
  async ({
    account,
    anchorProvider,
    limit = DEFAULT_PAGE_AMOUNT,
    page = 0,
    cluster: _cluster,
  }: {
    account: CSAccount
    anchorProvider: AnchorProvider
    cluster: Cluster
    page?: number
    limit?: number
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')
    const pubKey = new PublicKey(account.solanaAddress)

    const fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      anchorProvider,
      page + 1,
      limit,
    )

    const hotspotsMetadata = await solUtils.getCompressedNFTMetadata(
      fetchedHotspots.items,
    )

    const hotspotsRewards = await solUtils.getHotspotPendingRewards(
      anchorProvider,
      fetchedHotspots.items,
    )

    return {
      fetchedHotspots,
      hotspotsMetadata,
      hotspotsRewards,
      page: page + 1,
      limit,
      total: fetchedHotspots.grandTotal,
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

      state[cluster][address] = {
        ...state[cluster][address],
        loading: false,
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchHotspots.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const address = action.meta.arg.account.solanaAddress
      const { cluster, page } = action.meta.arg

      const prev = state[cluster][address] || {
        hotspotsById: {},
        hotspotsMetadataById: {},
        hotspotsRewardsById: {},
        totalHotspots: undefined,
      }

      state[cluster][address] = {
        ...prev,
        loading: !page,
        fetchingMore: !!page && Object.values(prev.hotspotsById).length > 0,
        onEndReached: false,
      }
    })
    builder.addCase(fetchHotspots.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg
      const {
        fetchedHotspots,
        hotspotsMetadata,
        hotspotsRewards,
        limit,
        page,
      } = action.payload

      const address = action.meta.arg.account.solanaAddress
      const onEndReached = limit ? fetchedHotspots.items.length < limit : true

      const prev = state[cluster][address]
      state[cluster][address] = {
        ...state[cluster][address],
        hotspotsById: fetchedHotspots.items.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item,
          }),
          page === 1 ? {} : prev.hotspotsById,
        ),
        hotspotsMetadataById: hotspotsMetadata.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item.metadata,
          }),
          page === 1 ? {} : prev.hotspotsMetadataById,
        ),
        hotspotsRewardsById: hotspotsRewards.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item.pendingRewards,
          }),
          page === 1 ? {} : prev.hotspotsRewardsById,
        ),
        totalHotspots: fetchedHotspots.grandTotal,
        loading: false,
        fetchingMore: false,
        onEndReached,
        page,
      }
    })
    builder.addCase(fetchHotspots.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        hotspotsById: {},
        hotspotsMetadataById: {},
        hotspotsRewardsById: {},
      }

      state[cluster][address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
      }
    })
    builder.addCase(fetchAllHotspots.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const address = action.meta.arg.account.solanaAddress
      const { cluster } = action.meta.arg

      const prev = state[cluster][address] || {
        hotspotsById: {},
        hotspotsMetadataById: {},
        hotspotsRewardsById: {},
        totalHotspots: undefined,
      }

      state[cluster][address] = {
        ...prev,
        loading: true,
      }
    })
    builder.addCase(fetchAllHotspots.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg
      const { fetchedHotspots } = action.payload

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address]

      state[cluster][address] = {
        ...state[cluster][address],
        hotspotsById: fetchedHotspots.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item,
          }),
          prev.hotspotsById || {},
        ),
        totalHotspots: fetchedHotspots.length,
        loading: false,
        fetchingMore: false,
        onEndReached: true,
      }
    })
    builder.addCase(fetchAllHotspots.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        hotspotsById: {},
        hotspotsMetadataById: {},
        hotspotsRewardsById: {},
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
