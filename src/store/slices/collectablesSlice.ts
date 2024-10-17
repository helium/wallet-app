import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cluster, Connection, PublicKey } from '@solana/web3.js'
import { WrappedConnection } from '@utils/WrappedConnection'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../storage/cloudStorage'
import { CompressedNFT } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'

export type WalletCollectables = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectables: Record<string, any[]>
  loading: boolean
}

export type CollectablesByWallet = Record<string, WalletCollectables>
export type CollectablesByCluster = {
  'mainnet-beta': CollectablesByWallet
  devnet: CollectablesByWallet
  testnet: CollectablesByWallet
  approvedCollections: string[]
}

const initialState: CollectablesByCluster = {
  'mainnet-beta': {},
  devnet: {},
  testnet: {},
  approvedCollections: solUtils.heliumNFTs(),
}

export const fetchCollectables = createAsyncThunk(
  'collectables/fetchCollectables',
  async (
    {
      account,
      connection,
    }: {
      account: CSAccount
      cluster: Cluster
      connection: Connection
    },
    { getState },
  ) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')
    const pubKey = new PublicKey(account.solanaAddress)
    let page = 1
    let isLastPage = false
    let fetchedCollectables: CompressedNFT[] = []

    const { collectables } = (await getState()) as {
      collectables: CollectablesByCluster
    }

    while (!isLastPage) {
      const response = await solUtils.getNFTs(
        pubKey,
        connection as WrappedConnection,
        page,
      )
      fetchedCollectables = fetchedCollectables.concat(response)
      isLastPage = response.length === 0
      page += 1
    }

    const approvedCollections =
      collectables.approvedCollections || solUtils.heliumNFTs()

    const filteredCollectables = fetchedCollectables.filter((collectable) => {
      const collection = collectable?.grouping?.find(
        (k) => k.group_key === 'collection',
      )?.group_value

      return approvedCollections.includes(collection)
    })

    const groupedCollectables = solUtils.groupNFTs(filteredCollectables)

    return {
      groupedCollectables,
    }
  },
)

const collectables = createSlice({
  name: 'collectables',
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
    toggleApprovedCollection: (
      state,
      action: PayloadAction<{ collection: string }>,
    ) => {
      if (!state.approvedCollections) {
        state.approvedCollections = []
      }

      if (state.approvedCollections.includes(action.payload.collection)) {
        state.approvedCollections = state.approvedCollections.filter(
          (c) => c !== action.payload.collection,
        )
      } else {
        state.approvedCollections.push(action.payload.collection)
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCollectables.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        collectables: {},
      }
      state[cluster][address] = {
        ...prev,
        loading: true,
      }
    })
    builder.addCase(fetchCollectables.fulfilled, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg
      const { groupedCollectables } = action.payload

      const address = action.meta.arg.account.solanaAddress

      state[cluster][address] = {
        collectables: groupedCollectables,
        loading: false,
      }
    })
    builder.addCase(fetchCollectables.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        collectables: {},
      }
      state[cluster][address] = {
        ...prev,
        loading: false,
      }
    })
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = collectables
export { collectables, name }
export default reducer
