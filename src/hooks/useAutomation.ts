import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useDebounce } from 'use-debounce'
import React, { useMemo } from 'react'
import { sleep } from '@helium/spl-utils'
import { cronJobKey, init as initCron } from '@helium/cron-sdk'
import { entityCronAuthorityKey } from '@helium/hpl-crons-sdk'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { useSubmitAndAwait } from './useSubmitAndAwait'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { MessagePreview } from '../solana/MessagePreview'
import {
  needsWalletClaim as isWalletClaimNeeded,
  shouldAddWalletClaim,
} from './automationClaimCount'

type Schedule = 'daily' | 'weekly' | 'monthly'

const INVALIDATE_QUERY_CACHE_DELAY = 3000

export function useAutomation() {
  const { currentAccount } = useAccountStorage()
  const client = useBlockchainApi()
  const queryClient = useQueryClient()
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { submitAndAwait } = useSubmitAndAwait()
  const { t } = useTranslation()

  const walletAddress = currentAccount?.solanaAddress

  // Number of claims on the wallet's entity-claim cron job, or null when the
  // cron job does not exist. getAutomationStatus does not return it.
  const fetchClaimCount = async (): Promise<number | null> => {
    if (!walletAddress || !anchorProvider) return null
    const cronJob = cronJobKey(
      entityCronAuthorityKey(new PublicKey(walletAddress))[0],
      0,
    )[0]
    const cronJobInfo = await anchorProvider.connection.getAccountInfo(
      cronJob,
      'confirmed',
    )
    if (!cronJobInfo) return null
    const cronProgram = await initCron(anchorProvider)
    // numTransactions drops when a claim is removed; nextTransactionId only rises
    return cronProgram.coder.accounts.decode<{ numTransactions: number }>(
      'cronJobV0',
      cronJobInfo.data,
    ).numTransactions
  }

  const refreshAutomationQueries = async () => {
    await sleep(INVALIDATE_QUERY_CACHE_DELAY)
    await queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
    await queryClient.invalidateQueries({
      queryKey: ['automationClaimCount'],
    })
  }

  const addWalletClaim = async () => {
    if (!walletAddress) throw new Error('Wallet address required')
    if (!walletSignBottomSheetRef) throw new Error('Wallet sign not available')

    const { transactionData } = await client.hotspots.addWalletToAutomation({
      walletAddress,
    })

    const decision = await walletSignBottomSheetRef.show({
      type: WalletStandardMessageTypes.signTransaction,
      url: '',
      header: t('automationScreen.addWalletClaim'),
      renderer: () =>
        React.createElement(MessagePreview, {
          message: t('automationScreen.addWalletClaimMessage'),
        }),
      suppressWarnings: false,
      serializedTxs: transactionData.transactions.map(
        ({ serializedTransaction }) =>
          Buffer.from(serializedTransaction, 'base64'),
      ),
    })

    if (!decision) {
      throw new Error('User rejected transaction')
    }

    await submitAndAwait({ transactionData })
  }

  // Get automation status
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['automationStatus', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address required')
      return client.hotspots.getAutomationStatus({ walletAddress })
    },
    enabled: !!walletAddress,
    refetchInterval: 30000, // Poll every 30 seconds
  })

  // A cron job with no claims runs on schedule but claims nothing
  const { data: claimCount } = useQuery({
    queryKey: ['automationClaimCount', walletAddress],
    queryFn: () => fetchClaimCount(),
    enabled: !!walletAddress && !!anchorProvider && !!status?.currentSchedule,
  })

  // Repair for cron jobs created without a claim
  const addWalletClaimMutation = useMutation({
    mutationFn: async () => {
      if (!anchorProvider) throw new Error('Wallet not connected')
      // Check again so a claim added elsewhere is not duplicated
      if (!shouldAddWalletClaim(await fetchClaimCount())) return
      await addWalletClaim()
    },
    onSuccess: refreshAutomationQueries,
    // Not awaited: TanStack awaits onError before it rejects
    onError: () => {
      refreshAutomationQueries().catch(() => {})
    },
  })

  // Create automation mutation
  const createAutomationMutation = useMutation({
    mutationFn: async ({
      schedule,
      duration,
      estimate,
    }: {
      schedule: Schedule
      duration: number
      estimate: {
        rentFee: number
        recipientFee: number
        operationalSol: number
      }
    }) => {
      if (!walletAddress) throw new Error('Wallet address required')
      if (!anchorProvider) throw new Error('Wallet not connected')
      if (!walletSignBottomSheetRef)
        throw new Error('Wallet sign not available')

      // Creates the cron job and adds the wallet claim in one signing round.
      // The server adds the claim only to a new or empty cron job, so a
      // requeued cron job keeps its claims.
      const { transactionData } =
        await client.hotspots.createWalletClaimAutomation({
          walletAddress,
          schedule,
          duration,
        })

      // Deserialize transactions for preview
      const transactions = transactionData.transactions.map(
        ({ serializedTransaction }) =>
          VersionedTransaction.deserialize(
            Buffer.from(serializedTransaction, 'base64'),
          ),
      )

      // Show preview
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('automationScreen.setupAutomation'),
        renderer: () =>
          React.createElement(MessagePreview, {
            message: t('automationScreen.setupAutomationMessage', {
              schedule,
              duration,
              rentFee: estimate.rentFee,
              recipientFee: estimate.recipientFee,
              solFee: Math.max(estimate.operationalSol, 0),
              interval:
                schedule === 'daily'
                  ? 'days'
                  : schedule === 'weekly'
                  ? 'weeks'
                  : 'months',
            }),
          }),
        suppressWarnings: false,
        serializedTxs: transactions.map((tx) => Buffer.from(tx.serialize())),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign, submit, and wait for confirmation
      await submitAndAwait({ transactionData })
    },
    onSuccess: refreshAutomationQueries,
    // Not awaited: TanStack awaits onError before it rejects
    onError: () => {
      refreshAutomationQueries().catch(() => {})
    },
  })

  // Fund automation mutation
  const fundAutomationMutation = useMutation({
    mutationFn: async ({
      additionalDuration,
      currentSchedule,
      estimate,
    }: {
      additionalDuration: number
      currentSchedule?: { schedule: Schedule }
      estimate: { totalSolNeeded: number }
    }) => {
      if (!walletAddress) throw new Error('Wallet address required')
      if (!anchorProvider) throw new Error('Wallet not connected')
      if (!walletSignBottomSheetRef)
        throw new Error('Wallet sign not available')

      const { transactionData } = await client.hotspots.fundAutomation({
        walletAddress,
        additionalDuration,
      })

      // Deserialize transactions for preview
      const transactions = transactionData.transactions.map(
        ({ serializedTransaction }) =>
          VersionedTransaction.deserialize(
            Buffer.from(serializedTransaction, 'base64'),
          ),
      )

      // Show preview
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('automationScreen.fundAutomation'),
        renderer: () =>
          React.createElement(MessagePreview, {
            message: t('automationScreen.fundAutomationMessage', {
              duration: additionalDuration,
              interval:
                currentSchedule?.schedule === 'daily'
                  ? 'days'
                  : currentSchedule?.schedule === 'weekly'
                  ? 'weeks'
                  : 'months',
              totalFunding: estimate.totalSolNeeded,
            }),
          }),
        suppressWarnings: false,
        serializedTxs: transactions.map((tx) => Buffer.from(tx.serialize())),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign, submit, and wait for confirmation
      await submitAndAwait({ transactionData })
    },
    onSuccess: async () => {
      await sleep(INVALIDATE_QUERY_CACHE_DELAY)
      await queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
    },
  })

  // Close automation mutation
  const closeAutomationMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error('Wallet address required')
      if (!anchorProvider) throw new Error('Wallet not connected')
      if (!walletSignBottomSheetRef)
        throw new Error('Wallet sign not available')

      const { transactionData } = await client.hotspots.closeAutomation({
        walletAddress,
      })

      // Deserialize transactions for preview
      const transactions = transactionData.transactions.map(
        ({ serializedTransaction }) =>
          VersionedTransaction.deserialize(
            Buffer.from(serializedTransaction, 'base64'),
          ),
      )

      // Show preview
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('automationScreen.removeAutomation'),
        renderer: () =>
          React.createElement(MessagePreview, {
            message: t('automationScreen.removeAutomationMessage'),
          }),
        suppressWarnings: false,
        serializedTxs: transactions.map((tx) => Buffer.from(tx.serialize())),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign, submit, and wait for confirmation
      await submitAndAwait({ transactionData })
    },
    onSuccess: async () => {
      await sleep(INVALIDATE_QUERY_CACHE_DELAY)
      await queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
      queryClient.removeQueries({ queryKey: ['automationClaimCount'] })
    },
  })

  return {
    // Status data
    status,
    statusLoading,
    statusError,
    refetchStatus,
    hasExistingAutomation: status?.hasExistingAutomation ?? false,
    isOutOfSol: status?.isOutOfSol ?? false,
    currentSchedule: status?.currentSchedule,
    rentFee: status?.rentFee ?? 0,
    recipientFee: status?.recipientFee ?? 0,
    solFee: status?.operationalSol ?? 0,
    remainingClaims: status?.remainingClaims,
    fundingPeriodInfo: status?.fundingPeriodInfo,
    cronJobBalance: status?.cronJobBalance,
    pdaWalletBalance: status?.pdaWalletBalance,
    needsWalletClaim: isWalletClaimNeeded(
      status?.hasExistingAutomation ?? false,
      claimCount,
    ),

    addWalletClaim: addWalletClaimMutation.mutateAsync,
    addWalletClaimLoading: addWalletClaimMutation.isPending,
    addWalletClaimError: addWalletClaimMutation.error,

    // Mutations
    createAutomation: createAutomationMutation.mutateAsync,
    createAutomationLoading: createAutomationMutation.isPending,
    createAutomationError: createAutomationMutation.error,

    fundAutomation: fundAutomationMutation.mutateAsync,
    fundAutomationLoading: fundAutomationMutation.isPending,
    fundAutomationError: fundAutomationMutation.error,

    closeAutomation: closeAutomationMutation.mutateAsync,
    closeAutomationLoading: closeAutomationMutation.isPending,
    closeAutomationError: closeAutomationMutation.error,
  }
}

// Pass setupSchedule only for a new setup: the estimate then prices the cron
// job on that schedule plus the wallet claim createWalletClaimAutomation adds.
// Leave it out to fund an existing cron job, so a different schedule does not
// price a re-created one.
export function useFundingEstimate(
  duration: number | string | undefined,
  setupSchedule?: Schedule,
) {
  const { currentAccount } = useAccountStorage()
  const client = useBlockchainApi()

  const walletAddress = currentAccount?.solanaAddress
  const durationNum = useMemo(() => {
    if (!duration) return 0
    const parsed =
      typeof duration === 'string' ? parseInt(duration, 10) : duration
    // eslint-disable-next-line no-restricted-globals
    return isNaN(parsed) ? 0 : parsed
  }, [duration])

  // Debounce duration to avoid excessive API calls
  const [debouncedDuration] = useDebounce(durationNum, 500)

  const {
    data: estimate,
    isLoading: estimateLoading,
    error: estimateError,
  } = useQuery({
    queryKey: [
      'fundingEstimate',
      walletAddress,
      debouncedDuration,
      setupSchedule,
    ],
    queryFn: async () => {
      if (!walletAddress || debouncedDuration <= 0) {
        return null
      }
      return client.hotspots.getFundingEstimate({
        walletAddress,
        duration: debouncedDuration,
        ...(setupSchedule && {
          schedule: setupSchedule,
          claims: { kind: 'wallet' as const },
        }),
      })
    },
    enabled: !!walletAddress && debouncedDuration > 0,
  })

  // Until the debounce settles, the estimate is for the previous duration
  const isDebouncing = durationNum !== debouncedDuration

  return {
    estimate: isDebouncing ? undefined : estimate,
    estimateLoading: estimateLoading || isDebouncing,
    estimateError,
  }
}
