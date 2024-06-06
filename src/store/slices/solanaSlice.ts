/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { AnchorProvider } from '@coral-xyz/anchor'
import {
  formBulkTransactions,
  getBulkRewards,
} from '@helium/distributor-oracle'
import {
  decodeEntityKey,
  init,
  keyToAssetForAsset,
} from '@helium/helium-entity-manager-sdk'
import * as lz from '@helium/lazy-distributor-sdk'
import {
  TransactionDraft,
  bulkSendRawTransactions,
  bulkSendTransactions,
  chunks,
  populateMissingDraftInfo,
  sendAndConfirmWithRetry,
  toVersionedTx,
} from '@helium/spl-utils'
import {
  PayloadAction,
  SerializedError,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit'
import {
  Cluster,
  PublicKey,
  SignaturesForAddressOptions,
  VersionedTransaction,
} from '@solana/web3.js'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import BN from 'bn.js'
import bs58 from 'bs58'
import { first, last } from 'lodash'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../storage/cloudStorage'
import { Activity } from '../../types/activity'
import { CompressedNFT, HotspotWithPendingRewards } from '../../types/solana'
import * as Logger from '../../utils/logger'
import * as solUtils from '../../utils/solanaUtils'
import { postPayment } from '../../utils/walletApiV2'
import { fetchCollectables } from './collectablesSlice'
import { fetchHotspots } from './hotspotsSlice'

type TokenActivity = Record<string, Activity[]>

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
    progress?: { percent: number; text: string } // 0-100
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
  paymentTxns: TransactionDraft[]
}

type CollectablePaymentInput = {
  account: CSAccount
  cluster: Cluster
  anchorProvider: AnchorProvider
  transferTxn: TransactionDraft
}

type AnchorTxnInput = {
  txn: TransactionDraft
  anchorProvider: AnchorProvider
  cluster: Cluster
}

type ClaimRewardInput = {
  account: CSAccount
  txns: VersionedTransaction[]
  anchorProvider: AnchorProvider
  cluster: Cluster
}

type ClaimAllRewardsInput = {
  account: CSAccount
  lazyDistributors: PublicKey[]
  hotspots: HotspotWithPendingRewards[]
  anchorProvider: AnchorProvider
  cluster: Cluster
  totalHotspots: number | undefined
}

type TreasurySwapTxn = {
  cluster: Cluster
  anchorProvider: AnchorProvider
  swapTxn: TransactionDraft
}

type JupiterSwapTxn = {
  cluster: Cluster
  anchorProvider: AnchorProvider
  swapTxn: VersionedTransaction
}

type MintDataCreditsInput = {
  anchorProvider: AnchorProvider
  cluster: Cluster
  swapTxn: TransactionDraft
}

type DelegateDataCreditsInput = {
  anchorProvider: AnchorProvider
  cluster: Cluster
  delegateDCTxn: TransactionDraft
}

type UpdateRewardsDestinationInput = {
  account: CSAccount
  cluster: Cluster
  anchorProvider: AnchorProvider
  txn: TransactionDraft
}

export const makePayment = createAsyncThunk(
  'solana/makePayment',
  async ({ account, cluster, anchorProvider, paymentTxns }: PaymentInput) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    const signatures = await bulkSendTransactions(
      anchorProvider,
      paymentTxns,
      undefined,
      10,
      [],
      MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
    )

    postPayment({ signatures, cluster })

    postPayment({
      signatures,
      cluster,
    })

    return signatures
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
      const signed = await anchorProvider.wallet.signTransaction(
        toVersionedTx(
          await populateMissingDraftInfo(
            anchorProvider.connection,
            transferTxn,
          ),
        ),
      )

      const { txid: sig } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      postPayment({ signatures: [sig], cluster })

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
      const signed = await anchorProvider.wallet.signTransaction(
        toVersionedTx(
          await populateMissingDraftInfo(anchorProvider.connection, swapTxn),
        ),
      )

      const { txid: sig } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      postPayment({ signatures: [sig], cluster })
    } catch (error) {
      Logger.error(error)
      throw error
    }
    return true
  },
)

export const sendJupiterSwap = createAsyncThunk(
  'solana/sendJupiterSwap',
  async ({ cluster, anchorProvider, swapTxn }: JupiterSwapTxn) => {
    try {
      const signed = await anchorProvider.wallet.signTransaction(swapTxn)

      const { txid: sig } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      postPayment({ signatures: [sig], cluster })
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
      const signed = await anchorProvider.wallet.signTransaction(
        toVersionedTx(
          await populateMissingDraftInfo(anchorProvider.connection, swapTxn),
        ),
      )

      const { txid: sig } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      postPayment({ signatures: [sig], cluster })
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
      const signed = await anchorProvider.wallet.signTransaction(
        toVersionedTx(
          await populateMissingDraftInfo(
            anchorProvider.connection,
            delegateDCTxn,
          ),
        ),
      )

      const { txid: sig } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      postPayment({ signatures: [sig], cluster })
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
      const signed = await anchorProvider.wallet.signTransaction(
        toVersionedTx(
          await populateMissingDraftInfo(anchorProvider.connection, txn),
        ),
      )
      const { txid } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        { skipPreflight: true },
        'confirmed',
      )
      postPayment({ signatures: [txid], cluster })
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
      const signatures = await bulkSendRawTransactions(
        anchorProvider.connection,
        signed.map((s) => Buffer.from(s.serialize())),
      )

      postPayment({ signatures, cluster })

      // If the transfer is successful, we need to update the hotspots so pending rewards are updated.
      dispatch(fetchHotspots({ account, anchorProvider, cluster }))

      return { signatures }
    } catch (error) {
      Logger.error(error)
      throw error
    }
  },
)

async function getAllHotspots(
  provider: AnchorProvider,
  wallet: PublicKey,
): Promise<HotspotWithPendingRewards[]> {
  let fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
    wallet,
    provider,
    1,
    1000,
  )

  let hotspots: CompressedNFT[] = []

  while (hotspots.length < fetchedHotspots.total) {
    hotspots = hotspots.concat(fetchedHotspots.items)
    fetchedHotspots = await solUtils.getCompressedCollectablesByCreator(
      wallet,
      provider,
      fetchedHotspots.page + 1,
      1000,
    )
  }

  return solUtils.annotateWithPendingRewards(provider, hotspots)
}
const CHUNK_SIZE = 25
export const claimAllRewards = createAsyncThunk(
  'solana/claimAllRewards',
  async (
    {
      account,
      anchorProvider,
      cluster,
      lazyDistributors,
      hotspots: hotspotsIn,
      totalHotspots,
    }: ClaimAllRewardsInput,
    { dispatch },
  ) => {
    try {
      let hotspots = hotspotsIn
      if (hotspots.length < (totalHotspots || 0)) {
        hotspots = await getAllHotspots(
          anchorProvider,
          anchorProvider.wallet.publicKey,
        )
      }
      const ret: string[] = []
      let triesRemaining = 10
      const program = await lz.init(anchorProvider)
      const hemProgram = await init(anchorProvider)

      const mints = await Promise.all(
        lazyDistributors.map(async (d) => {
          return (await program.account.lazyDistributorV0.fetch(d)).rewardsMint
        }),
      )
      const ldToMint = lazyDistributors.reduce((acc, ld, index) => {
        acc[ld.toBase58()] = mints[index]
        return acc
      }, {} as Record<string, PublicKey>)
      // One tx per hotspot per mint/lazy dist
      const totalTxns = hotspots.reduce((acc, hotspot) => {
        mints.forEach((mint) => {
          if (
            hotspot.pendingRewards &&
            hotspot.pendingRewards[mint.toString()] &&
            new BN(hotspot.pendingRewards[mint.toString()]).gt(new BN(0))
          )
            acc += 1
        })
        return acc
      }, 0)
      dispatch(
        solanaSlice.actions.setPaymentProgress({
          percent: 0,
          text: 'Preparing transactions...',
        }),
      )
      for (const lazyDistributor of lazyDistributors) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const mint = ldToMint[lazyDistributor.toBase58()]!
        const hotspotsWithRewards = hotspots.filter(
          (hotspot) =>
            hotspot.pendingRewards &&
            new BN(hotspot.pendingRewards[mint.toBase58()]).gt(new BN(0)),
        )
        for (let chunk of chunks(hotspotsWithRewards, CHUNK_SIZE)) {
          const thisRet: string[] = []
          // Continually send in bulk while resetting blockhash until we send them all
          // eslint-disable-next-line no-constant-condition
          while (true) {
            dispatch(
              solanaSlice.actions.setPaymentProgress({
                percent: ((ret.length + thisRet.length) * 100) / totalTxns,
                text: `Preparing batch of ${chunk.length} transactions.\n${
                  totalTxns - ret.length
                } total transactions remaining.`,
              }),
            )
            const recentBlockhash =
              // eslint-disable-next-line no-await-in-loop
              await anchorProvider.connection.getLatestBlockhash('confirmed')

            const keyToAssets = chunk.map((h) =>
              keyToAssetForAsset(solUtils.toAsset(h)),
            )
            const ktaAccs = await solUtils.getCachedKeyToAssets(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              hemProgram as any,
              keyToAssets,
            )
            const entityKeys = ktaAccs.map(
              (kta) =>
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                decodeEntityKey(kta.entityKey, kta.keySerialization)!,
            )

            const rewards = await getBulkRewards(
              program,
              lazyDistributor,
              entityKeys,
            )
            dispatch(
              solanaSlice.actions.setPaymentProgress({
                percent: ((ret.length + thisRet.length) * 100) / totalTxns,
                text: `Sending batch of ${chunk.length} transactions.\n${
                  totalTxns - ret.length
                } total transactions remaining.`,
              }),
            )

            const txns = await formBulkTransactions({
              program,
              rewards,
              assets: chunk.map((h) => new PublicKey(h.id)),
              compressionAssetAccs: chunk.map(solUtils.toAsset),
              lazyDistributor,
              assetEndpoint: anchorProvider.connection.rpcEndpoint,
              wallet: anchorProvider.wallet.publicKey,
            })

            const signedTxs = await anchorProvider.wallet.signAllTransactions(
              txns,
            )

            // eslint-disable-next-line @typescript-eslint/no-loop-func
            const txsWithSigs = signedTxs.map((tx, index) => ({
              transaction: chunk[index],
              sig: bs58.encode(tx.signatures[0]),
            }))

            // eslint-disable-next-line no-await-in-loop
            const confirmedTxs = await bulkSendRawTransactions(
              anchorProvider.connection,
              signedTxs.map((s) => Buffer.from(s.serialize())),
              ({ totalProgress }) =>
                dispatch(
                  solanaSlice.actions.setPaymentProgress({
                    percent:
                      ((totalProgress + ret.length + thisRet.length) * 100) /
                      totalTxns,
                    text: `Confirming ${txns.length - totalProgress}/${
                      txns.length
                    } transactions.\n${
                      totalTxns - ret.length - thisRet.length
                    } total transactions remaining`,
                  }),
                ),
              recentBlockhash.lastValidBlockHeight,
              // Hail mary, try with preflight enabled. Sometimes this causes
              // errors that wouldn't otherwise happen
              triesRemaining !== 1,
            )
            thisRet.push(...confirmedTxs)
            if (confirmedTxs.length === signedTxs.length) {
              break
            }

            const retSet = new Set(thisRet)

            chunk = txsWithSigs
              .filter(({ sig }) => !retSet.has(sig))
              .map(({ transaction }) => transaction)

            triesRemaining -= 1
            if (triesRemaining <= 0) {
              throw new Error(
                `Failed to submit all txs after blockhashes expired, ${
                  signedTxs.length - confirmedTxs.length
                } remain`,
              )
            }
          }
          ret.push(...thisRet)
        }
      }

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
      mint,
      requestType,
    }: {
      account: CSAccount
      anchorProvider: AnchorProvider
      mint: string
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

    const existing = solana.activity.data[account.solanaAddress]?.all?.[mint]

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
      mint,
      options,
    )
  },
)

export const updateRewardsDestinations = createAsyncThunk(
  'solana/updateRewardsDestinations',
  async (
    { account, anchorProvider, cluster, txn }: UpdateRewardsDestinationInput,
    { dispatch },
  ) => {
    if (!account?.solanaAddress) throw new Error('No solana account found')

    try {
      const signed = await anchorProvider.wallet.signTransaction(
        toVersionedTx(
          await populateMissingDraftInfo(anchorProvider.connection, txn),
        ),
      )

      const { txid: sig } = await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      postPayment({ signatures: [sig], cluster })

      dispatch(fetchHotspots({ account, anchorProvider, cluster }))
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
    setPaymentProgress: (
      state,
      action: PayloadAction<{ percent: number; text: string }>,
    ) => {
      if (state.payment) {
        state.payment.progress = action.payload
      }
    },
    resetPayment: (state) => {
      state.payment = {
        success: false,
        loading: false,
        error: undefined,
        signature: undefined,
        progress: undefined,
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
        progress: undefined,
      }
    })
    builder.addCase(claimRewards.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
        progress: undefined,
      }
    })
    builder.addCase(claimRewards.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
        progress: undefined,
      }
    })
    builder.addCase(claimRewards.fulfilled, (state, _action) => {
      const { signatures } = _action.payload
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
        signature: signatures[0],
        progress: undefined,
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
    builder.addCase(sendJupiterSwap.rejected, (state, action) => {
      state.payment = {
        success: false,
        loading: false,
        error: action.error,
        signature: undefined,
      }
    })
    builder.addCase(sendJupiterSwap.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(sendJupiterSwap.fulfilled, (state, _action) => {
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
    builder.addCase(updateRewardsDestinations.pending, (state, _action) => {
      state.payment = {
        success: false,
        loading: true,
        error: undefined,
        signature: undefined,
      }
    })
    builder.addCase(updateRewardsDestinations.fulfilled, (state, _action) => {
      state.payment = {
        success: true,
        loading: false,
        error: undefined,
      }
    })
    builder.addCase(updateRewardsDestinations.rejected, (state, action) => {
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
        mint,
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
      const prevAll = state.activity.data[address].all[mint]
      const prevPayment = state.activity.data[address].payment[mint]
      const prevDelegate = state.activity.data[address].delegate[mint]
      const prevMint = state.activity.data[address].mint[mint]

      switch (requestType) {
        case 'start_fresh': {
          state.activity.data[address].all[mint] = payload
          state.activity.data[address].payment[mint] = payload
          state.activity.data[address].delegate[mint] = payload
          state.activity.data[address].mint[mint] = payload
          break
        }
        case 'fetch_more': {
          state.activity.data[address].all[mint] = [...prevAll, ...payload]
          state.activity.data[address].payment[mint] = [
            ...prevPayment,
            ...payload,
          ]
          state.activity.data[address].delegate[mint] = [
            ...prevDelegate,
            ...payload,
          ]
          state.activity.data[address].mint[mint] = [
            ...prevDelegate,
            ...payload,
          ]
          break
        }
        case 'update_head': {
          state.activity.data[address].all[mint] = [...payload, ...prevAll]
          state.activity.data[address].payment[mint] = [
            ...payload,
            ...prevPayment,
          ]
          state.activity.data[address].delegate[mint] = [
            ...payload,
            ...prevDelegate,
          ]
          state.activity.data[address].mint[mint] = [...payload, ...prevMint]
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
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = solanaSlice
export { name, solanaSlice }
export default reducer
