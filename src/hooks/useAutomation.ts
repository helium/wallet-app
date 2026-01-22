import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useDebounce } from 'use-debounce'
import React, { useMemo } from 'react'
import { sleep } from '@helium/spl-utils'
import { VersionedTransaction } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { useSubmitAndAwait } from './useSubmitAndAwait'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { MessagePreview } from '../solana/MessagePreview'

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

  // Create automation mutation
  const createAutomationMutation = useMutation({
    mutationFn: async ({
      schedule,
      duration,
      totalHotspots,
      estimate,
    }: {
      schedule: Schedule
      duration: number
      totalHotspots: number
      estimate?: {
        rentFee: number
        recipientFee: number
        operationalSol: number
      }
    }) => {
      if (!walletAddress) throw new Error('Wallet address required')
      if (!anchorProvider) throw new Error('Wallet not connected')
      if (!walletSignBottomSheetRef)
        throw new Error('Wallet sign not available')

      const { transactionData } = await client.hotspots.createAutomation({
        walletAddress,
        schedule,
        duration,
        totalHotspots,
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
              rentFee: estimate?.rentFee ?? 0,
              recipientFee: estimate?.recipientFee ?? 0,
              solFee: Math.max(estimate?.operationalSol ?? 0, 0),
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
    onSuccess: async () => {
      await sleep(INVALIDATE_QUERY_CACHE_DELAY)
      await queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
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
      estimate?: { totalSolNeeded: number }
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
              totalFunding: estimate?.totalSolNeeded ?? 0,
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

export function useFundingEstimate(duration: number | string | undefined) {
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
    queryKey: ['fundingEstimate', walletAddress, debouncedDuration],
    queryFn: async () => {
      if (!walletAddress || debouncedDuration <= 0) {
        return null
      }
      return client.hotspots.getFundingEstimate({
        walletAddress,
        duration: debouncedDuration,
      })
    },
    enabled: !!walletAddress && debouncedDuration > 0,
  })

  return {
    estimate,
    estimateLoading,
    estimateError,
  }
}
