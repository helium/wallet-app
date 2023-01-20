import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as web3 from '@solana/web3.js'
import { merge } from 'lodash'
import { CSAccount } from '../../storage/cloudStorage'
import { CompressedNFT } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'

export type WalletCollectables = {
  collectables: Record<string, CompressedNFT[]>
  collectablesWithMeta: Record<string, CompressedNFT[]>
  loading: boolean
  fetchingMore: boolean
  onEndReached: boolean
  oldestCollectableId: string
}

export type CollectablesState = Record<string, WalletCollectables>

const initialState: CollectablesState = {}

export const fetchCollectables = createAsyncThunk(
  'collectables/fetchCollectables',
  async ({
    account,
    cluster,
  }: {
    account: CSAccount
    cluster: web3.Cluster
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new web3.PublicKey(account.solanaAddress)
    const fetchedCollectables = await solUtils.getCompressedCollectables(
      pubKey,
      cluster,
    )
    const groupedCollectables = solUtils.groupCollectables(fetchedCollectables)

    const collectablesWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedCollectables,
    )

    const groupedCollectablesWithMeta = solUtils.groupCollectablesWithMetaData(
      collectablesWithMetadata,
    )

    return {
      groupedCollectables,
      groupedCollectablesWithMeta,
      oldestCollectableId:
        fetchedCollectables.length > 0
          ? fetchedCollectables[fetchedCollectables.length - 1].id
          : '',
    }
  },
)

export const fetchMoreCollectables = createAsyncThunk(
  'collectables/fetchMoreCollectables',
  async ({
    account,
    cluster,
    oldestCollectable = '',
  }: {
    account: CSAccount
    cluster: web3.Cluster
    oldestCollectable: string
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const pubKey = new web3.PublicKey(account.solanaAddress)
    const fetchedCollectables = await solUtils.getCompressedCollectables(
      pubKey,
      cluster,
      oldestCollectable,
    )
    const groupedCollectables = solUtils.groupCollectables(fetchedCollectables)

    const collectablesWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedCollectables,
    )

    const groupedCollectablesWithMeta = solUtils.groupCollectablesWithMetaData(
      collectablesWithMetadata,
    )

    return {
      groupedCollectables,
      groupedCollectablesWithMeta,
      oldestCollectableId:
        fetchedCollectables.length > 0
          ? fetchedCollectables[fetchedCollectables.length - 1].id
          : '',
    }
  },
)

const collectables = createSlice({
  name: 'collectables',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCollectables.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        collectablesWithMeta: {},
        collectables: {},
      }
      state[address] = {
        ...prev,
        loading: true,
        fetchingMore: false,
        onEndReached: false,
      }
    })
    builder.addCase(fetchCollectables.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { groupedCollectables, groupedCollectablesWithMeta } =
        action.payload

      const address = action.meta.arg.account.solanaAddress
      state[address] = {
        collectables: groupedCollectables,
        collectablesWithMeta: groupedCollectablesWithMeta,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
        oldestCollectableId: action.payload.oldestCollectableId,
      }
    })
    builder.addCase(fetchCollectables.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        collectablesWithMeta: {},
        collectables: {},
      }
      state[address] = {
        ...prev,
        loading: false,
        fetchingMore: false,
        onEndReached: false,
      }
    })
    builder.addCase(fetchMoreCollectables.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        collectablesWithMeta: {},
        collectables: {},
      }
      state[address] = {
        ...prev,
        loading: true,
        fetchingMore: true,
        onEndReached: false,
      }
    })
    builder.addCase(fetchMoreCollectables.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { groupedCollectables, groupedCollectablesWithMeta } =
        action.payload

      const address = action.meta.arg.account.solanaAddress
      const onEndReached = Object.keys(groupedCollectables).length === 0

      state[address] = {
        collectables: merge(groupedCollectables, state[address].collectables),
        collectablesWithMeta: merge(
          groupedCollectablesWithMeta,
          state[address].collectablesWithMeta,
        ),
        loading: false,
        fetchingMore: false,
        onEndReached,
        oldestCollectableId: action.payload.oldestCollectableId,
      }
    })
    builder.addCase(fetchMoreCollectables.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state

      const address = action.meta.arg.account.solanaAddress
      const prev = state[address] || {
        collectablesWithMeta: {},
        collectables: {},
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

const { reducer, name } = collectables
export { name, collectables }
export default reducer
