import type { TokenAmountOutput } from '@helium/blockchain-api'
import { useCallback, useState } from 'react'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { useCurrentWallet } from './useCurrentWallet'
import {
  useGovernanceSubmit,
  type GovernanceSubmitOptions,
} from './useGovernanceSubmit'
import { hashTagParams } from '../utils/transactionUtils'

type BlockchainApiClient = ReturnType<typeof useBlockchainApi>
type GovernanceClient = BlockchainApiClient['governance']
type GovernanceMethod = keyof GovernanceClient
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiInput<M extends GovernanceMethod> = Parameters<GovernanceClient[M]>[0]
type ApiParams<M extends GovernanceMethod> = Omit<ApiInput<M>, 'walletAddress'>

function requireWallet(wallet: ReturnType<typeof useCurrentWallet>): string {
  if (!wallet) throw new Error('Wallet not connected')
  return wallet.toBase58()
}

function useMutationState() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const wrapMutate = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsPending(true)
      setError(null)
      try {
        return await fn()
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        throw err
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setError(null)
    setIsPending(false)
  }, [])

  return { isPending, error, reset, wrapMutate }
}

function responseHasMore(r: unknown): r is { hasMore: boolean } {
  return typeof r === 'object' && r !== null && 'hasMore' in r
}

// ─── Factory ───────────────────────────────────────────────────────────────

function useGovernanceMutation<
  M extends GovernanceMethod,
  TParams = ApiParams<M>,
>(config: {
  method: M
  buildTag: (params: TParams) => string
  mapParams?: (params: TParams) => ApiParams<M>
}) {
  const client = useBlockchainApi()
  const { submit: submitTxn } = useGovernanceSubmit()
  const wallet = useCurrentWallet()
  const { isPending, error, reset, wrapMutate } = useMutationState()
  const [estimatedSolFee, setEstimatedSolFee] =
    useState<TokenAmountOutput | null>(null)

  const resolveApiParams = useCallback(
    (params: TParams): ApiParams<M> =>
      config.mapParams ? config.mapParams(params) : (params as ApiParams<M>),
    [config],
  )

  // TS can't narrow a generic-indexed union of callables — safe because each
  // call site pins M to a literal, keeping the public API fully typed.
  // eslint-disable-next-line @typescript-eslint/ban-types
  const apiFn = client.governance[config.method] as Function

  const callApi = useCallback(
    async (params: TParams) => {
      const walletAddress = requireWallet(wallet)
      const apiParams = resolveApiParams(params)
      const response = await apiFn({ walletAddress, ...apiParams })
      setEstimatedSolFee(response.estimatedSolFee ?? null)
      return response
    },
    [wallet, resolveApiParams, apiFn],
  )

  const prepare = useCallback((params: TParams) => callApi(params), [callApi])

  const submit = useCallback(
    (params: TParams, options: GovernanceSubmitOptions) =>
      wrapMutate(async () => {
        const response = await callApi(params)
        const tag = config.buildTag(params)
        const walletAddress = requireWallet(wallet)
        const fetchMore =
          responseHasMore(response) && response.hasMore
            ? () => {
                const apiParams = resolveApiParams(params)
                return apiFn({ walletAddress, ...apiParams })
              }
            : undefined
        return submitTxn(response, { ...options, tag }, fetchMore)
      }),
    [wrapMutate, callApi, wallet, submitTxn, config, resolveApiParams, apiFn],
  )

  const resetAll = useCallback(() => {
    reset()
    setEstimatedSolFee(null)
  }, [reset])

  return {
    prepare,
    submit,
    estimatedSolFee,
    isPending,
    error,
    reset: resetAll,
  }
}

// ─── Position Mutations ─────────────────────────────────────────────────────

type CreatePositionParams = {
  amount: string
  mint: string
  lockupKind: 'cliff' | 'constant'
  lockupPeriodsInDays: number
  subDaoMint?: string
  automationEnabled?: boolean
}

export function useCreatePositionMutation() {
  return useGovernanceMutation<'createPosition', CreatePositionParams>({
    method: 'createPosition',
    buildTag: (p) =>
      `gov-createPosition-${hashTagParams({
        mint: p.mint,
        lockupKind: p.lockupKind,
        lockupPeriodsInDays: p.lockupPeriodsInDays,
      })}`,
    mapParams: ({ amount, mint, ...rest }) => ({
      tokenAmount: { amount, mint },
      ...rest,
    }),
  })
}

export function useClosePositionMutation() {
  return useGovernanceMutation({
    method: 'closePosition',
    buildTag: (p) => `gov-close-${hashTagParams({ position: p.positionMint })}`,
  })
}

export function useExtendPositionMutation() {
  return useGovernanceMutation({
    method: 'extendPosition',
    buildTag: (p) =>
      `gov-extend-${hashTagParams({
        position: p.positionMint,
        lockupPeriodInDays: p.lockupPeriodsInDays,
      })}`,
  })
}

export function useFlipLockupKindMutation() {
  return useGovernanceMutation({
    method: 'flipLockupKind',
    buildTag: (p) =>
      `gov-flipLockupKind-${hashTagParams({ position: p.positionMint })}`,
  })
}

type SplitPositionParams = {
  sourcePositionMint: string
  amount: string
  lockupKind: 'cliff' | 'constant'
  lockupPeriodsInDays: number
}

export function useSplitPositionMutation() {
  return useGovernanceMutation<'splitPosition', SplitPositionParams>({
    method: 'splitPosition',
    buildTag: (p) =>
      `gov-split-${hashTagParams({
        position: p.sourcePositionMint,
        amount: p.amount,
        lockupKind: p.lockupKind,
        lockupPeriodInDays: p.lockupPeriodsInDays,
      })}`,
    mapParams: ({ sourcePositionMint, ...rest }) => ({
      positionMint: sourcePositionMint,
      ...rest,
    }),
  })
}

type TransferPositionParams = {
  sourcePositionMint: string
  targetPositionMint: string
  amount: string
}

export function useTransferPositionMutation() {
  return useGovernanceMutation<'transferPosition', TransferPositionParams>({
    method: 'transferPosition',
    buildTag: (p) =>
      `gov-transfer-${hashTagParams({
        sourcePosition: p.sourcePositionMint,
        targetPosition: p.targetPositionMint,
        amount: p.amount,
      })}`,
    mapParams: ({ sourcePositionMint, ...rest }) => ({
      positionMint: sourcePositionMint,
      ...rest,
    }),
  })
}

// ─── Delegation Mutations ───────────────────────────────────────────────────

export function useDelegatePositionMutation() {
  return useGovernanceMutation({
    method: 'delegatePositions',
    buildTag: (p) =>
      `gov-delegate-${hashTagParams({
        subDao: p.subDaoMint,
        automationEnabled: p.automationEnabled ? 1 : 0,
      })}`,
  })
}

export function useExtendDelegationMutation() {
  return useGovernanceMutation({
    method: 'extendDelegation',
    buildTag: (p) =>
      `gov-extendDelegation-${hashTagParams({ position: p.positionMint })}`,
  })
}

export function useUndelegatePositionMutation() {
  return useGovernanceMutation({
    method: 'undelegatePosition',
    buildTag: (p) =>
      `gov-undelegate-${hashTagParams({ position: p.positionMint })}`,
  })
}

export function useClaimRewardsMutation() {
  return useGovernanceMutation({
    method: 'claimDelegationRewards',
    buildTag: (p) =>
      `gov-claimRewards-${hashTagParams({
        positions: p.positionMints.sort().join(','),
      })}`,
  })
}

// ─── Voting Mutations ───────────────────────────────────────────────────────

export function useVoteMutation() {
  return useGovernanceMutation({
    method: 'vote',
    buildTag: (p) =>
      `proposal-vote-${hashTagParams({
        proposal: p.proposalKey,
        choice: p.choice,
      })}`,
  })
}

export function useRelinquishVoteMutation() {
  return useGovernanceMutation({
    method: 'relinquishVote',
    buildTag: (p) =>
      `proposal-relinquish-${hashTagParams({
        proposal: p.proposalKey,
        choice: p.choice,
      })}`,
  })
}

export function useRelinquishPositionVotesMutation() {
  return useGovernanceMutation({
    method: 'relinquishPositionVotes',
    buildTag: (p) =>
      `gov-relinquish-${hashTagParams({
        position: p.positionMint,
        organization: p.organization,
      })}`,
  })
}

// ─── Proxy Mutations ────────────────────────────────────────────────────────

export function useAssignProxiesMutation() {
  return useGovernanceMutation({
    method: 'assignProxies',
    buildTag: (p) =>
      `assign-proxy-${hashTagParams({
        proxyWallet: p.proxyKey,
        expirationTime: p.expirationTime,
        positions: p.positionMints.sort().join(','),
      })}`,
  })
}

export function useUnassignProxiesMutation() {
  return useGovernanceMutation({
    method: 'unassignProxies',
    buildTag: (p) =>
      `revoke-proxy-${hashTagParams({
        proxyKey: p.proxyKey,
        positions: p.positionMints.sort().join(','),
      })}`,
  })
}
