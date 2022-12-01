import { JsonMetadata, Metadata, Metaplex } from '@metaplex-foundation/js'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as web3 from '@solana/web3.js'
import { CSAccount } from '../../storage/cloudStorage'
import { Collectable } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'

export type WalletCollectables = {
  collectables: Record<string, Metadata<JsonMetadata<string>>[]>
  collectablesWithMeta: Record<string, Collectable[]>
  loading: boolean
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
    const connection = solUtils.getConnection(cluster)

    const metaplex = new Metaplex(connection, { cluster })
    const pubKey = new web3.PublicKey(account.solanaAddress)
    const fetchedCollectables = await solUtils.getCollectables(pubKey, '')
    const groupedCollectables = await solUtils.groupCollectables(
      fetchedCollectables,
    )

    const collectablesWithMetadata = await solUtils.getCollectablesMetadata(
      fetchedCollectables,
      metaplex,
    )

    const groupedCollectablesWithMeta = solUtils.groupCollectablesWithMetaData(
      collectablesWithMetadata,
    )
    return { groupedCollectables, groupedCollectablesWithMeta }
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
      }
    })
  },
})

const { reducer, name } = collectables
export { name, collectables }
export default reducer
