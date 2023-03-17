import Balance, { AnyCurrencyType, Ticker } from '@helium/currency'
import { AnchorProvider } from '@coral-xyz/anchor'
import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit'
import {
  Cluster,
  PublicKey,
  SignaturesForAddressOptions,
  Transaction,
} from '@solana/web3.js'
import { first, last } from 'lodash'
import {
  bulkSendRawTransactions,
  sendAndConfirmWithRetry,
} from '@helium/spl-utils'
import { Mints } from '@utils/constants'
import { CSAccount } from '../../storage/cloudStorage'
import { Activity } from '../../types/activity'
import { CompressedNFT, toMintAddress } from '../../types/solana'
import * as solUtils from '../../utils/solanaUtils'
import { fetchCollectables } from './collectablesSlice'
import { walletRestApi } from './walletRestApi'
import * as Logger from '../../utils/logger'
import { fetchHotspots } from './hotspotsSlice'

type Balances = {
  hntBalance?: bigint
  dcBalance?: bigint
  dcReceived?: bigint
  dcDelegated?: bigint
  mobileBalance?: bigint
  iotBalance?: bigint
  secBalance?: bigint
  solBalance?: number
  stakedBalance?: bigint
  loading?: boolean
}

type TokenActivity = Record<Ticker, Activity[]>

type SolActivity = {
  all: TokenActivity
  payment: TokenActivity
  delegate: TokenActivity
  mint: TokenActivity
}

export type SolanaState = {
  balances: Record<string, Balances>
  payment?: { loading?: boolean; error?: SerializedError; success?: boolean }
  activity: {
    loading?: boolean
    data: Record<string, SolActivity>
    error?: SerializedError
  }
  delegate?: { loading?: boolean; error?: SerializedError; success?: boolean }
}

const initialState: SolanaState = {
  balances: {},
  activity: { data: {} },
}

export const readBalances = createAsyncThunk(
  'solana/readBalance',
  async ({
    acct,
    cluster,
    mints,
  }: {
    acct: CSAccount
    cluster: Cluster
    mints: Record<string, string>
  }) => {
    if (!acct?.solanaAddress) throw new Error('No solana account found')

    const heliumBals = await solUtils.readHeliumBalances(
      cluster,
      acct.solanaAddress,
      mints,
    )

    const solBalance = await solUtils.readSolanaBalance(
      cluster,
      acct.solanaAddress,
    )

    const dcReceived = await solUtils.getBalanceFromTokenAccount(
      cluster,
      solUtils.getEscrowTokenAccount(acct.solanaAddress).toBase58(),
    )

    if (solBalance === 0 && cluster !== 'mainnet-beta') {
      solUtils.airdrop(cluster, acct.solanaAddress)
    }
    return { ...heliumBals, solBalance, dcReceived }
  },
)

type Payment = {
  payee: string
  balanceAmount: Balance<AnyCurrencyType>
  memo: string
  max?: boolean
}

type PaymentInput = {
  account: CSAccount
  payments: Payment[]
  cluster: Cluster
  mints: Record<string, string>
}

type CollectablePaymentInput = {
  account: CSAccount
  collectable: CompressedNFT
  payee: string
  cluster: Cluster
}

type AnchorTxnInput = {
  txn: Transaction
  anchorProvider: AnchorProvider
  cluster: Cluster
}

type ClaimRewardInput = {
  account: CSAccount
  txn: Transaction
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
  account: CSAccount
  anchorProvider: AnchorProvider
  cluster: Cluster
  amount: number
  fromMint: PublicKey
  mints: Record<string, string>
}

type MintDataCreditsInput = {
  account: CSAccount
  anchorProvider: AnchorProvider
  cluster: Cluster
  hntAmount: number
}

type DelegateDataCreditsInput = {
  account: CSAccount
  anchorProvider: AnchorProvider
  cluster: Cluster
  delegateAddress: string
  amount: number
}

export const makePayment = createAsyncThunk(
  'solana/makePayment',
  async ({ account, payments, cluster, mints }: PaymentInput, { dispatch }) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    const [firstPayment] = payments
    const mintAddress = toMintAddress(
      firstPayment.balanceAmount.type.ticker,
      mints,
    )
    const transfer = await solUtils.transferToken(
      cluster,
      account.solanaAddress,
      account.address,
      payments,
      mintAddress,
    )

    dispatch(readBalances({ cluster, acct: account, mints }))

    return dispatch(
      walletRestApi.endpoints.postPayment.initiate({
        txnSignature: transfer.signature,
        cluster,
      }),
    )
  },
)

export const makeCollectablePayment = createAsyncThunk(
  'solana/makeCollectablePayment',
  async (
    { account, collectable, payee, cluster }: CollectablePaymentInput,
    { dispatch },
  ) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    try {
      const transfer = collectable.compression.compressed
        ? await solUtils.transferCompressedCollectable(
            cluster,
            account.solanaAddress,
            account.address,
            collectable,
            payee,
          )
        : await solUtils.transferCollectable(
            cluster,
            account.solanaAddress,
            account.address,
            collectable,
            payee,
          )

      // If the transfer is successful, we need to update the collectables
      if (!transfer.txn?.meta?.err) {
        dispatch(fetchCollectables({ account, cluster }))
      }

      return await dispatch(
        walletRestApi.endpoints.postPayment.initiate({
          txnSignature: transfer.signature,
          cluster,
        }),
      )
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const sendTreasurySwap = createAsyncThunk(
  'solana/sendTreasurySwap',
  async (
    {
      account,
      anchorProvider,
      amount,
      fromMint,
      cluster,
      mints,
    }: TreasurySwapTxn,
    { dispatch },
  ) => {
    try {
      const swap = await solUtils.createTreasurySwapTxn(
        cluster,
        amount,
        fromMint,
        anchorProvider,
      )

      dispatch(readBalances({ cluster, acct: account, mints }))

      return await dispatch(
        walletRestApi.endpoints.postPayment.initiate({
          txnSignature: swap.signature,
          cluster,
        }),
      )
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const sendMintDataCredits = createAsyncThunk(
  'solana/sendMintDataCredits',
  async (
    { cluster, anchorProvider, hntAmount, account }: MintDataCreditsInput,
    { dispatch },
  ) => {
    try {
      const swap = await solUtils.mintDataCredits(
        cluster,
        anchorProvider,
        hntAmount,
      )

      dispatch(readBalances({ cluster, acct: account, mints: Mints }))

      return await dispatch(
        walletRestApi.endpoints.postPayment.initiate({
          txnSignature: swap.signature,
          cluster,
        }),
      )
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const sendDelegateDataCredits = createAsyncThunk(
  'solana/sendDelegateDataCredits',
  async (
    {
      cluster,
      anchorProvider,
      amount,
      account,
      delegateAddress,
    }: DelegateDataCreditsInput,
    { dispatch },
  ) => {
    try {
      const swap = await solUtils.delegateDataCredits(
        cluster,
        anchorProvider,
        delegateAddress,
        amount,
      )

      dispatch(readBalances({ cluster, acct: account, mints: Mints }))

      return await dispatch(
        walletRestApi.endpoints.postPayment.initiate({
          txnSignature: swap.signature,
          cluster,
        }),
      )
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const sendAnchorTxn = createAsyncThunk(
  'solana/sendAnchorTxn',
  async ({ txn, anchorProvider, cluster }: AnchorTxnInput, { dispatch }) => {
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

      return await dispatch(
        walletRestApi.endpoints.postPayment.initiate({
          txnSignature: txid,
          cluster,
        }),
      )
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const claimRewards = createAsyncThunk(
  'solana/claimRewards',
  async (
    { account, txn, anchorProvider, cluster }: ClaimRewardInput,
    { dispatch },
  ) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(txn)

      const { txid } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        signed.serialize(),
        { skipPreflight: true },
        'confirmed',
      )

      await dispatch(
        walletRestApi.endpoints.postPayment.initiate({
          txnSignature: txid,
          cluster,
        }),
      )

      // If the transfer is successful, we need to update the hotspots so pending rewards are updated.
      dispatch(fetchHotspots({ account, cluster, provider: anchorProvider }))
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

export const claimAllRewards = createAsyncThunk(
  'solana/claimAllRewards',
  async (
    { account, txns, anchorProvider, cluster }: ClaimAllRewardsInput,
    { dispatch },
  ) => {
    try {
      const signed = await anchorProvider.wallet.signAllTransactions(txns)

      await bulkSendRawTransactions(
        anchorProvider.connection,
        signed.map((s) => s.serialize()),
      )

      // If the transfer is successful, we need to update the hotspots so pending rewards are updated.
      dispatch(fetchHotspots({ account, cluster, provider: anchorProvider }))
      dispatch(readBalances({ cluster, acct: account, mints: Mints }))
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
      cluster,
      ticker,
      requestType,
      mints,
    }: {
      account: CSAccount
      cluster: Cluster
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
      cluster,
      account.solanaAddress,
      toMintAddress(ticker, mints),
      mints,
      options,
    )
  },
)

const solanaSlice = createSlice({
  name: 'solana',
  initialState,
  reducers: {
    resetPayment: (state) => {
      state.payment = { success: false, loading: false, error: undefined }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readBalances.pending, (state, action) => {
      if (!action.meta.arg?.acct.solanaAddress) return state
      const prev = state.balances[action.meta.arg?.acct.solanaAddress] || {}

      state.balances[action.meta.arg?.acct.solanaAddress] = {
        ...prev,
        loading: true,
      }
    })
    builder.addCase(readBalances.fulfilled, (state, action) => {
      if (!action.meta.arg?.acct.solanaAddress) return state
      state.balances[action.meta.arg?.acct.solanaAddress] = {
        ...action.payload,
        loading: false,
      }
    })
    builder.addCase(readBalances.rejected, (state, action) => {
      if (!action.meta.arg?.acct.solanaAddress) return state
      const prev = state.balances[action.meta.arg?.acct.solanaAddress] || {}
      state.balances[action.meta.arg?.acct.solanaAddress] = {
        ...prev,
        loading: false,
      }
    })
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
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(makePayment.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(makePayment.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(claimRewards.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(claimRewards.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(claimRewards.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendAnchorTxn.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(sendAnchorTxn.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(sendAnchorTxn.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendTreasurySwap.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(sendTreasurySwap.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(sendTreasurySwap.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendMintDataCredits.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(sendMintDataCredits.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(sendMintDataCredits.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(sendDelegateDataCredits.rejected, (state, action) => {
      state.delegate = { success: false, loading: false, error: action.error }
    })
    builder.addCase(sendDelegateDataCredits.pending, (state, _action) => {
      state.delegate = { success: false, loading: true, error: undefined }
    })
    builder.addCase(sendDelegateDataCredits.fulfilled, (state, _action) => {
      state.delegate = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(claimAllRewards.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
    })
    builder.addCase(claimAllRewards.pending, (state, _action) => {
      state.payment = { success: false, loading: true, error: undefined }
    })
    builder.addCase(claimAllRewards.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(makePayment.rejected, (state, action) => {
      state.payment = { success: false, loading: false, error: action.error }
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
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
