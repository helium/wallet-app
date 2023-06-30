import { AnchorProvider } from '@coral-xyz/anchor'
import { Ticker } from '@helium/currency'
import {
  bulkSendRawTransactions,
  sendAndConfirmWithRetry,
} from '@helium/spl-utils'
import {
  SerializedError,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit'
import {
  Cluster,
  SignaturesForAddressOptions,
  Transaction,
} from '@solana/web3.js'
import { first, last } from 'lodash'
import { CSAccount } from '../../storage/cloudStorage'
import { Activity } from '../../types/activity'
import { toMintAddress } from '../../types/solana'
import * as Logger from '../../utils/logger'
import * as solUtils from '../../utils/solanaUtils'
import { postPayment } from '../../utils/walletApiV2'
import { fetchCollectables } from './collectablesSlice'
import { fetchHotspots } from './hotspotsSlice'

type TokenActivity = Record<Ticker, Activity[]>

type SolActivity = {
  all: TokenActivity
  payment: TokenActivity
  delegate: TokenActivity
  mint: TokenActivity
}

export type SolanaState = {
  payment?: {
    loading?: boolean
    error?: SerializedError
    success?: boolean
    signature?: string
  }
  activity: {
    loading?: boolean
    data: Record<string, SolActivity>
    error?: SerializedError
  }
  delegate?: { loading?: boolean; error?: SerializedError; success?: boolean }
}

const initialState: SolanaState = {
  activity: { data: {} },
}

type PaymentInput = {
  account: CSAccount
  cluster: Cluster
  anchorProvider: AnchorProvider
  paymentTxn: Transaction
}

type CollectablePaymentInput = {
  account: CSAccount
  cluster: Cluster
  anchorProvider: AnchorProvider
  transferTxn: Transaction
}

type AnchorTxnInput = {
  txn: Transaction
  anchorProvider: AnchorProvider
  cluster: Cluster
}

type ClaimRewardInput = {
  account: CSAccount
  txns: Transaction[]
  anchorProvider: AnchorProvider
  cluster: Cluster
}

type ClaimAllRewardsInput = {
  account: CSAccount
  txns: Transaction[]
  anchorProvider: AnchorProvider
  cluster: Cluster
}

type TreasurySwapTxn = {
  cluster: Cluster
  anchorProvider: AnchorProvider
  swapTxn: Transaction
}

type MintDataCreditsInput = {
  anchorProvider: AnchorProvider
  cluster: Cluster
  swapTxn: Transaction
}

type DelegateDataCreditsInput = {
  anchorProvider: AnchorProvider
  cluster: Cluster
  delegateDCTxn: Transaction
}

type UpdateIotInfoInput = {
  account: CSAccount
  anchorProvider: AnchorProvider
  cluster: Cluster
  updateTxn: Transaction
}

type UpdateMobileInfoInput = {
  account: CSAccount
  anchorProvider: AnchorProvider
  cluster: Cluster
  updateTxn: Transaction
}

export const makePayment = createAsyncThunk(
  'solana/makePayment',
  async ({ account, cluster, anchorProvider, paymentTxn }: PaymentInput) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    const signed = await anchorProvider.wallet.signTransaction(paymentTxn)

    const signature = await anchorProvider.sendAndConfirm(signed)

    postPayment({ signature, cluster })

    postPayment({
      signature,
      cluster,
    })

    return signature
  },
)

export const makeCollectablePayment = createAsyncThunk(
  'solana/makeCollectablePayment',
  async (
    { account, transferTxn, cluster, anchorProvider }: CollectablePaymentInput,
    { dispatch },
  ) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    try {
      const signed = await anchorProvider.wallet.signTransaction(transferTxn)

      const sig = await anchorProvider.sendAndConfirm(signed)

      postPayment({ signature: sig, cluster })

      dispatch(
        fetchCollectables({
          account,
          cluster,
          connection: anchorProvider.connection,
        }),
      )
    } catch (error) {
      Logger.error(error)
      throw error
    }

    return true
  },
)

export const sendTreasurySwap = createAsyncThunk(
  'solana/sendTreasurySwap',
  async ({ cluster, anchorProvider, swapTxn }: TreasurySwapTxn) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(swapTxn)

      const sig = await anchorProvider.sendAndConfirm(signed)

      postPayment({ signature: sig, cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

export const sendMintDataCredits = createAsyncThunk(
  'solana/sendMintDataCredits',
  async ({ cluster, anchorProvider, swapTxn }: MintDataCreditsInput) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(swapTxn)

      const sig = await anchorProvider.sendAndConfirm(signed)

      postPayment({ signature: sig, cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

export const sendDelegateDataCredits = createAsyncThunk(
  'solana/sendDelegateDataCredits',
  async ({
    cluster,
    anchorProvider,
    delegateDCTxn,
  }: DelegateDataCreditsInput) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(delegateDCTxn)

      const sig = await anchorProvider.sendAndConfirm(signed)

      postPayment({ signature: sig, cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

export const sendAnchorTxn = createAsyncThunk(
  'solana/sendAnchorTxn',
  async ({ txn, anchorProvider, cluster }: AnchorTxnInput) => {
    try {
      const { blockhash } = await anchorProvider.connection.getLatestBlockhash(
        'recent',
      )
      txn.recentBlockhash = blockhash
      txn.feePayer = anchorProvider.wallet.publicKey
      const signed = await anchorProvider.wallet.signTransaction(txn)
      const { txid } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        signed.serialize(),
        { skipPreflight: true },
        'confirmed',
      )

      postPayment({ signature: txid, cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

export const claimRewards = createAsyncThunk(
  'solana/claimRewards',
  async (
    { account, anchorProvider, cluster, txns }: ClaimRewardInput,
    { dispatch },
  ) => {
    try {
      const signed = await anchorProvider.wallet.signAllTransactions(txns)

      const sigs = await bulkSendRawTransactions(
        anchorProvider.connection,
        signed.map((s) => s.serialize()),
      )

      postPayment({ signature: sigs[0], cluster })

      // If the transfer is successful, we need to update the hotspots so pending rewards are updated.
      dispatch(fetchHotspots({ account, anchorProvider, cluster }))

      return {
        signature: sigs[0],
      }
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const claimAllRewards = createAsyncThunk(
  'solana/claimAllRewards',
  async (
    { account, anchorProvider, cluster, txns }: ClaimAllRewardsInput,
    { dispatch },
  ) => {
    try {
      const signed = await anchorProvider.wallet.signAllTransactions(txns)

      // eslint-disable-next-line no-await-in-loop
      await bulkSendRawTransactions(
        anchorProvider.connection,
        signed.map((s) => s.serialize()),
      )

      // If the claim is successful, we need to update the hotspots so pending rewards are updated.
      dispatch(fetchHotspots({ account, anchorProvider, cluster }))
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const getTxns = createAsyncThunk(
  'solana/getTxns',
  async (
    {
      account,
      anchorProvider,
      ticker,
      requestType,
      mints,
    }: {
      account: CSAccount
      anchorProvider: AnchorProvider
      ticker: Ticker
      mints: Record<string, string>
      requestType: 'update_head' | 'start_fresh' | 'fetch_more'
    },
    { getState },
  ) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    const options: SignaturesForAddressOptions = {
      limit: 20,
    }

    const { solana } = (await getState()) as {
      solana: SolanaState
    }

    const existing = solana.activity.data[account.solanaAddress]?.all?.[ticker]

    if (requestType === 'fetch_more') {
      const lastActivity = last(existing)
      if (!lastActivity) {
        throw new Error("Can't fetch more")
      }
      options.before = lastActivity.hash
    } else if (requestType === 'update_head') {
      const firstActvity = first(existing)
      if (!firstActvity) {
        throw new Error("Can't update head")
      }

      options.until = firstActvity.hash
    }

    return solUtils.getTransactions(
      anchorProvider,
      account.solanaAddress,
      toMintAddress(ticker, mints),
      mints,
      options,
    )
  },
)

export const sendUpdateIotInfo = createAsyncThunk(
  'solana/sendUpdateIotInfo',
  async ({ cluster, anchorProvider, updateTxn }: UpdateIotInfoInput) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(updateTxn)
      const sig = await anchorProvider.sendAndConfirm(signed)

      postPayment({ signature: sig, cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

export const sendUpdateMobileInfo = createAsyncThunk(
  'solana/sendUpdateMobileInfo',
  async ({ cluster, anchorProvider, updateTxn }: UpdateMobileInfoInput) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(updateTxn)
      const sig = await anchorProvider.sendAndConfirm(signed)

      postPayment({ signature: sig, cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {
    resetPayment: (state) => {
      state.payment = {
        success: false,
        loading: false,
        error: undefined,
        signature: undefined,
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(makeCollectablePayment.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(makeCollectablePayment.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(makeCollectablePayment.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(makePayment.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(makePayment.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(claimRewards.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(claimRewards.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(claimRewards.fulfilled, (state, _action) => {
      const { signature } = _action.payload
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
        signature,
      }
    })
    builder.addCase(sendAnchorTxn.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(sendAnchorTxn.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(sendAnchorTxn.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendTreasurySwap.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(sendTreasurySwap.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(sendTreasurySwap.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendMintDataCredits.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(sendMintDataCredits.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(sendMintDataCredits.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendDelegateDataCredits.rejected, (state, action) => {
      state.delegate = {
        success: false,
        loading: false,
        error: action.error,
      }
    })
    builder.addCase(sendDelegateDataCredits.pending, (state, _action) => {
      state.delegate = {
        success: false,
        loading: true,
        error: undefined,
      }
    })
    builder.addCase(sendDelegateDataCredits.fulfilled, (state, _action) => {
      state.delegate = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(claimAllRewards.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(claimAllRewards.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(claimAllRewards.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(makePayment.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(getTxns.pending, (state, _action) => {
      state.activity.loading = true
      state.activity.error = undefined
    })
    builder.addCase(getTxns.fulfilled, (state, { meta, payload }) => {
      if (!meta.arg.account.solanaAddress) return

      const {
        ticker,
        account: { solanaAddress: address },
        requestType,
      } = meta.arg

      state.activity.loading = false
      state.activity.error = undefined

      state.activity = state.activity || {}
      state.activity.data = state.activity.data || {}
      state.activity.data[address] = state.activity.data[address] || {
        all: {},
        payment: {},
        delegate: {},
        mint: {},
      }

      if (!state.activity.data[address].delegate) {
        state.activity.data[address].delegate = state.activity.data[address].all
      }

      if (!state.activity.data[address].mint) {
        state.activity.data[address].mint = state.activity.data[address].all
      }

      const prevAll = state.activity.data[address].all[ticker]
      const prevPayment = state.activity.data[address].payment[ticker]
      const prevDelegate = state.activity.data[address].delegate[ticker]
      const prevMint = state.activity.data[address].mint[ticker]

      switch (requestType) {
        case 'start_fresh': {
          state.activity.data[address].all[ticker] = payload
          state.activity.data[address].payment[ticker] = payload
          state.activity.data[address].delegate[ticker] = payload
          state.activity.data[address].mint[ticker] = payload
          break
        }
        case 'fetch_more': {
          state.activity.data[address].all[ticker] = [...prevAll, ...payload]
          state.activity.data[address].payment[ticker] = [
            ...prevPayment,
            ...payload,
          ]
          state.activity.data[address].delegate[ticker] = [
            ...prevDelegate,
            ...payload,
          ]
          state.activity.data[address].mint[ticker] = [
            ...prevDelegate,
            ...payload,
          ]
          break
        }
        case 'update_head': {
          state.activity.data[address].all[ticker] = [...payload, ...prevAll]
          state.activity.data[address].payment[ticker] = [
            ...payload,
            ...prevPayment,
          ]
          state.activity.data[address].delegate[ticker] = [
            ...payload,
            ...prevDelegate,
          ]
          state.activity.data[address].mint[ticker] = [...payload, ...prevMint]
          break
        }
      }
    })
    builder.addCase(getTxns.rejected, (state, { error, meta }) => {
      state.activity.loading = false

      // Only store the error if it was a fresh load
      if (meta.arg.requestType === 'start_fresh') {
        state.activity.error = error
      }
    })
    builder.addCase(sendUpdateIotInfo.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(sendUpdateIotInfo.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(sendUpdateIotInfo.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendUpdateMobileInfo.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(sendUpdateMobileInfo.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(sendUpdateMobileInfo.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
