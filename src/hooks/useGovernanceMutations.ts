import type { GovernanceTransactionResponse } from '@helium/blockchain-api'
import { useCallback, useState } from 'react'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { useCurrentWallet } from './useCurrentWallet'
import {
  useGovernanceSubmit,
  type GovernanceSubmitOptions,
} from './useGovernanceSubmit'
import { hashTagParams } from '../utils/transactionUtils'

type TokenAmountOutput = NonNullable<
  GovernanceTransactionResponse['estimatedSolFee']
>

function requireWallet(wallet: ReturnType<typeof useCurrentWallet>): string {
  if (!wallet) throw new Error('Wallet not connected')
  return wallet.toBase58()
}

// ─── Position Mutations ─────────────────────────────────────────────────────

export function useCreatePositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()
  const [estimatedSolFee, setEstimatedSolFee] =
    useState<TokenAmountOutput | null>(null)

  const prefetch = useCallback(
    async (params: {
      amount: string
      lockupKind: 'cliff' | 'constant'
      lockupPeriodsInDays: number
      mint: string
      subDaoMint?: string
      automationEnabled?: boolean
    }) => {
      if (!wallet) return
      try {
        const response = await client.governance.positions.create({
          walletAddress: wallet.toBase58(),
          ...params,
        })
        setEstimatedSolFee(response.estimatedSolFee ?? null)
        return response
      } catch {
        setEstimatedSolFee(null)
      }
    },
    [client, wallet],
  )

  const mutate = useCallback(
    async (
      params: {
        amount: string
        lockupKind: 'cliff' | 'constant'
        lockupPeriodsInDays: number
        mint: string
        subDaoMint?: string
        automationEnabled?: boolean
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.positions.create({
        walletAddress,
        ...params,
      })
      setEstimatedSolFee(response.estimatedSolFee ?? null)

      const tag = `gov-createPosition-${hashTagParams({
        mint: params.mint,
        lockupKind: params.lockupKind,
        lockupPeriodsInDays: params.lockupPeriodsInDays,
      })}`

      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, prefetch, estimatedSolFee, isPending, error, reset }
}

export function useClosePositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMint: string },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.positions.close({
        walletAddress,
        ...params,
      })
      const tag = `gov-close-${hashTagParams({
        position: params.positionMint,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useExtendPositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMint: string; lockupPeriodsInDays: number },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.positions.extend({
        walletAddress,
        ...params,
      })
      const tag = `gov-extend-${hashTagParams({
        position: params.positionMint,
        lockupPeriodInDays: params.lockupPeriodsInDays,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useFlipLockupKindMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMint: string },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.positions.flipLockupKind({
        walletAddress,
        ...params,
      })
      const tag = `gov-flipLockupKind-${hashTagParams({
        position: params.positionMint,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useSplitPositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: {
        sourcePositionMint: string
        amount: string
        lockupKind: 'cliff' | 'constant'
        lockupPeriodsInDays: number
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.positions.split({
        walletAddress,
        ...params,
      })
      const tag = `gov-split-${hashTagParams({
        position: params.sourcePositionMint,
        amount: params.amount,
        lockupKind: params.lockupKind,
        lockupPeriodInDays: params.lockupPeriodsInDays,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useTransferPositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: {
        sourcePositionMint: string
        targetPositionMint: string
        amount: string
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.positions.transfer({
        walletAddress,
        ...params,
      })
      const tag = `gov-transfer-${hashTagParams({
        sourcePosition: params.sourcePositionMint,
        targetPosition: params.targetPositionMint,
        amount: params.amount,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

// ─── Delegation Mutations ───────────────────────────────────────────────────

export function useDelegatePositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()
  const [estimatedSolFee, setEstimatedSolFee] =
    useState<TokenAmountOutput | null>(null)

  const prefetch = useCallback(
    async (params: {
      positionMints: string[]
      subDaoMint: string
      automationEnabled?: boolean
    }) => {
      if (!wallet) return
      try {
        const response = await client.governance.delegation.delegate({
          walletAddress: wallet.toBase58(),
          ...params,
        })
        setEstimatedSolFee(response.estimatedSolFee ?? null)
        return response
      } catch {
        setEstimatedSolFee(null)
      }
    },
    [client, wallet],
  )

  const mutate = useCallback(
    async (
      params: {
        positionMints: string[]
        subDaoMint: string
        automationEnabled?: boolean
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.delegation.delegate({
        walletAddress,
        ...params,
      })
      setEstimatedSolFee(response.estimatedSolFee ?? null)

      const tag = `gov-delegate-${hashTagParams({
        subDao: params.subDaoMint,
        automationEnabled: params.automationEnabled ? 1 : 0,
      })}`

      const fetchMore = response.hasMore
        ? () =>
            client.governance.delegation.delegate({
              walletAddress,
              ...params,
            })
        : undefined

      return submit(response, { ...options, tag }, fetchMore)
    },
    [client, wallet, submit],
  )

  return { mutate, prefetch, estimatedSolFee, isPending, error, reset }
}

export function useExtendDelegationMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMint: string },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.delegation.extend({
        walletAddress,
        ...params,
      })
      const tag = `gov-extendDelegation-${hashTagParams({
        position: params.positionMint,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useUndelegatePositionMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMint: string },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.delegation.undelegate({
        walletAddress,
        ...params,
      })
      const tag = `gov-undelegate-${hashTagParams({
        position: params.positionMint,
      })}`

      const fetchMore = response.hasMore
        ? () =>
            client.governance.delegation.undelegate({
              walletAddress,
              ...params,
            })
        : undefined

      return submit(response, { ...options, tag }, fetchMore)
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useClaimRewardsMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMints: string[] },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.delegation.claimRewards({
        walletAddress,
        ...params,
      })
      const tag = `gov-claimRewards-${hashTagParams({
        positions: params.positionMints.sort().join(','),
      })}`

      const fetchMore = response.hasMore
        ? () =>
            client.governance.delegation.claimRewards({
              walletAddress,
              ...params,
            })
        : undefined

      return submit(response, { ...options, tag }, fetchMore)
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

// ─── Voting Mutations ───────────────────────────────────────────────────────

export function useVoteMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: {
        proposalKey: string
        positionMints: string[]
        choice: number
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.voting.vote({
        walletAddress,
        ...params,
      })
      const tag = `proposal-vote-${hashTagParams({
        proposal: params.proposalKey,
        choice: params.choice,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useRelinquishVoteMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: {
        proposalKey: string
        positionMints: string[]
        choice: number
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.voting.relinquishVote({
        walletAddress,
        ...params,
      })
      const tag = `proposal-relinquish-${hashTagParams({
        proposal: params.proposalKey,
        choice: params.choice,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useRelinquishPositionVotesMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMint: string; organization: string },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.voting.relinquishPositionVotes({
        walletAddress,
        ...params,
      })
      const tag = `gov-relinquish-${hashTagParams({
        position: params.positionMint,
        organization: params.organization,
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

// ─── Proxy Mutations ────────────────────────────────────────────────────────

export function useAssignProxiesMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: {
        positionMints: string[]
        recipient: string
        expirationTime: number
      },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.proxy.assign({
        walletAddress,
        ...params,
      })
      const tag = `assign-proxy-${hashTagParams({
        proxyWallet: params.recipient,
        expirationTime: params.expirationTime,
        positions: params.positionMints.sort().join(','),
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}

export function useUnassignProxiesMutation() {
  const client = useBlockchainApi()
  const { submit, isPending, error, reset } = useGovernanceSubmit()
  const wallet = useCurrentWallet()

  const mutate = useCallback(
    async (
      params: { positionMints: string[] },
      options: GovernanceSubmitOptions,
    ) => {
      const walletAddress = requireWallet(wallet)
      const response = await client.governance.proxy.unassign({
        walletAddress,
        ...params,
      })
      const tag = `revoke-proxy-${hashTagParams({
        positions: params.positionMints.sort().join(','),
      })}`
      return submit(response, { ...options, tag })
    },
    [client, wallet, submit],
  )

  return { mutate, isPending, error, reset }
}
