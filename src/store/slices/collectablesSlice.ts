import { JsonMetadata, Metadata, Metaplex } from '@metaplex-foundation/js'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey, Cluster, Connection } from '@solana/web3.js'
import { CSAccount } from '../../storage/cloudStorage'
import { Collectable } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'

export type WalletCollectables = {
  collectables: Record<string, Metadata<JsonMetadata<string>>[]>
  collectablesWithMeta: Record<string, Collectable[]>
  loading: boolean
}

export type CollectablesByWallet = Record<string, WalletCollectables>
export type CollectablesByCluster = Record<Cluster, CollectablesByWallet>

const initialState: CollectablesByCluster = {
  'mainnet-beta': {},
  devnet: {},
  testnet: {},
}

export const fetchCollectables = createAsyncThunk(
  'collectables/fetchCollectables',
  async ({
    account,
    cluster,
    connection,
  }: {
    account: CSAccount
    cluster: Cluster
    connection: Connection
  }) => {
    if (!account.solanaAddress) throw new Error('Solana address missing')

    const metaplex = new Metaplex(connection, { cluster })

    const pubKey = new PublicKey(account.solanaAddress)
    const fetchedCollectables = await solUtils.getNFTs(pubKey, metaplex)
    const groupedCollectables = solUtils.groupNFTs(fetchedCollectables)

    const collectablesWithMetadata = await solUtils.getNFTsMetadata(
      fetchedCollectables,
      metaplex,
    )

    const groupedCollectablesWithMeta = solUtils.groupNFTsWithMetaData(
      collectablesWithMetadata,
    )

    return {
      groupedCollectables,
      groupedCollectablesWithMeta,
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
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCollectables.pending, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        collectablesWithMeta: {},
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
      const { groupedCollectables, groupedCollectablesWithMeta } =
        action.payload

      const address = action.meta.arg.account.solanaAddress

      state[cluster][address] = {
        collectables: groupedCollectables,
        collectablesWithMeta: groupedCollectablesWithMeta,
        loading: false,
      }
    })
    builder.addCase(fetchCollectables.rejected, (state, action) => {
      if (!action.meta.arg?.account.solanaAddress) return state
      const { cluster } = action.meta.arg

      const address = action.meta.arg.account.solanaAddress
      const prev = state[cluster][address] || {
        collectablesWithMeta: {},
        collectables: {},
      }
      state[cluster][address] = {
        ...prev,
        loading: false,
      }
    })
  },
})

const { reducer, name } = collectables
export { name, collectables }
export default reducer
