import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useDebounce } from 'use-debounce'
import { useMemo } from 'react'

type Schedule = 'daily' | 'weekly' | 'monthly'

export function useAutomation() {
  const { currentAccount } = useAccountStorage()
  const client = useBlockchainApi()
  const queryClient = useQueryClient()

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
    }: {
      schedule: Schedule
      duration: number
      totalHotspots: number
    }) => {
      if (!walletAddress) throw new Error('Wallet address required')
      return client.hotspots.createAutomation({
        walletAddress,
        schedule,
        duration,
        totalHotspots,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
    },
  })

  // Fund automation mutation
  const fundAutomationMutation = useMutation({
    mutationFn: async ({
      additionalDuration,
    }: {
      additionalDuration: number
    }) => {
      if (!walletAddress) throw new Error('Wallet address required')
      return client.hotspots.fundAutomation({
        walletAddress,
        additionalDuration,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
    },
  })

  // Close automation mutation
  const closeAutomationMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error('Wallet address required')
      return client.hotspots.closeAutomation({ walletAddress })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationStatus'] })
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
