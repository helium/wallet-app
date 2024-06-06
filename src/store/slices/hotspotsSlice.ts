import { AnchorProvider } from '@coral-xyz/anchor'
import { RecipientV0 } from '@hooks/useRecipient'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster, PublicKey } from '@solana/web3.js'
import { PURGE } from 'redux-persist'
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

  hotspotsById: { [key: string]: CompressedNFT }
  hotspotsMetadataById: { [key: string]: { [key: string]: any } }
  hotspotsRewardsById: { [key: string]: { [key: string]: string } }
  hotspotsRecipientsById: {
    [key: string]: { [key: string]: RecipientV0 | undefined }
  }
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

    let pageNumber = 1
    let fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      pubKey,
      anchorProvider,
      pageNumber,
      1000,
    )

    const hotspots: CompressedNFT[] = fetchedHotspots.items ?? []

    while (
      hotspots.length < (fetchedHotspots.grandTotal ?? fetchedHotspots.total)
    ) {
      // eslint-disable-next-line no-plusplus
      pageNumber++
      fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
        pubKey,
        anchorProvider,
        pageNumber,
        1000,
      )

      hotspots.push(...(fetchedHotspots.items ?? []))
    }

    const hotspotsRecipients = await solUtils.getHotspotRecipients(
      anchorProvider,
      hotspots,
    )

    return {
      fetchedHotspots: hotspots,
      hotspotsRecipients,
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

    const hotspotsRecipients = await solUtils.getHotspotRecipients(
      anchorProvider,
      fetchedHotspots.items,
    )

    return {
      fetchedHotspots,
      hotspotsMetadata,
      hotspotsRewards,
      hotspotsRecipients,
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
        hotspotsRecipientsById: {},
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
        hotspotsRecipients,
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
        hotspotsRecipientsById: hotspotsRecipients.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item.recipients,
          }),
          page === 1 ? {} : prev.hotspotsRecipientsById,
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
        hotspotsRecipientsById: {},
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
        hotspotsRecipientsById: {},
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
      const { fetchedHotspots, hotspotsRecipients } = action.payload

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
        hotspotsRecipientsById: hotspotsRecipients.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item.recipients,
          }),
          prev.hotspotsRecipientsById || {},
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
        hotspotsRecipientsById: {},
      }

      state[cluster][address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: true,
      }
    })
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = hotspotSlice
export { hotspotSlice as hotspotsSlice, name }
export default reducer
