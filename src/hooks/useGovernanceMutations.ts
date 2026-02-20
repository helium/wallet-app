import type { GovernanceTransactionResponse } from '@helium/blockchain-api'
import { useCallback, useState } from 'react'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'
import { useCurrentWallet } from './useCurrentWallet'
import {
  useGovernanceSubmit,
  type GovernanceSubmitOptions,
} from './useGovernanceSubmit'
import { hashTagParams } from '../utils/transactionUtils'

type BlockchainApiClient = ReturnType<typeof useBlockchainApi>

type TokenAmountOutput = NonNullable<
  GovernanceTransactionResponse['estimatedSolFee']
>

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

// ─── Factory ───────────────────────────────────────────────────────────────

interface MutationConfig<TParams> {
  apiCall: (
    client: BlockchainApiClient,
    walletAddress: string,
    params: TParams,
  ) => Promise<GovernanceTransactionResponse>
  buildTag: (params: TParams) => string
  hasFetchMore?: boolean
}

function useGovernanceMutation<TParams>(config: MutationConfig<TParams>) {
  const client = useBlockchainApi()
  const { submit: submitTxn } = useGovernanceSubmit()
  const wallet = useCurrentWallet()
  const { isPending, error, reset, wrapMutate } = useMutationState()
  const [estimatedSolFee, setEstimatedSolFee] =
    useState<TokenAmountOutput | null>(null)

  const callApi = useCallback(
    async (params: TParams): Promise<GovernanceTransactionResponse> => {
      const walletAddress = requireWallet(wallet)
      const response = await config.apiCall(client, walletAddress, params)
      setEstimatedSolFee(response.estimatedSolFee ?? null)
      return response
    },
    [client, wallet, config],
  )

  const prepare = useCallback((params: TParams) => callApi(params), [callApi])

  const submit = useCallback(
    (params: TParams, options: GovernanceSubmitOptions) =>
      wrapMutate(async () => {
        const response = await callApi(params)
        const tag = config.buildTag(params)
        const walletAddress = requireWallet(wallet)
        const fetchMore =
          config.hasFetchMore && response.hasMore
            ? () => config.apiCall(client, walletAddress, params)
            : undefined
        return submitTxn(response, { ...options, tag }, fetchMore)
      }),
    [wrapMutate, callApi, client, wallet, submitTxn, config],
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

const CREATE_POSITION_CONFIG: MutationConfig<{
  amount: string
  lockupKind: 'cliff' | 'constant'
  lockupPeriodsInDays: number
  mint: string
  subDaoMint?: string
  automationEnabled?: boolean
}> = {
  apiCall: (client, walletAddress, { amount, mint, ...rest }) =>
    client.governance.createPosition({
      walletAddress,
      tokenAmount: { amount, mint },
      ...rest,
    }),
  buildTag: (params) =>
    `gov-createPosition-${hashTagParams({
      mint: params.mint,
      lockupKind: params.lockupKind,
      lockupPeriodsInDays: params.lockupPeriodsInDays,
    })}`,
}

export function useCreatePositionMutation() {
  return useGovernanceMutation(CREATE_POSITION_CONFIG)
}

const CLOSE_POSITION_CONFIG: MutationConfig<{ positionMint: string }> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.closePosition({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-close-${hashTagParams({ position: params.positionMint })}`,
}

export function useClosePositionMutation() {
  return useGovernanceMutation(CLOSE_POSITION_CONFIG)
}

const EXTEND_POSITION_CONFIG: MutationConfig<{
  positionMint: string
  lockupPeriodsInDays: number
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.extendPosition({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-extend-${hashTagParams({
      position: params.positionMint,
      lockupPeriodInDays: params.lockupPeriodsInDays,
    })}`,
}

export function useExtendPositionMutation() {
  return useGovernanceMutation(EXTEND_POSITION_CONFIG)
}

const FLIP_LOCKUP_KIND_CONFIG: MutationConfig<{ positionMint: string }> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.flipLockupKind({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-flipLockupKind-${hashTagParams({ position: params.positionMint })}`,
}

export function useFlipLockupKindMutation() {
  return useGovernanceMutation(FLIP_LOCKUP_KIND_CONFIG)
}

const SPLIT_POSITION_CONFIG: MutationConfig<{
  sourcePositionMint: string
  amount: string
  lockupKind: 'cliff' | 'constant'
  lockupPeriodsInDays: number
}> = {
  apiCall: (client, walletAddress, { sourcePositionMint, ...rest }) =>
    client.governance.splitPosition({
      walletAddress,
      positionMint: sourcePositionMint,
      ...rest,
    }),
  buildTag: (params) =>
    `gov-split-${hashTagParams({
      position: params.sourcePositionMint,
      amount: params.amount,
      lockupKind: params.lockupKind,
      lockupPeriodInDays: params.lockupPeriodsInDays,
    })}`,
}

export function useSplitPositionMutation() {
  return useGovernanceMutation(SPLIT_POSITION_CONFIG)
}

const TRANSFER_POSITION_CONFIG: MutationConfig<{
  sourcePositionMint: string
  targetPositionMint: string
  amount: string
}> = {
  apiCall: (client, walletAddress, { sourcePositionMint, ...rest }) =>
    client.governance.transferPosition({
      walletAddress,
      positionMint: sourcePositionMint,
      ...rest,
    }),
  buildTag: (params) =>
    `gov-transfer-${hashTagParams({
      sourcePosition: params.sourcePositionMint,
      targetPosition: params.targetPositionMint,
      amount: params.amount,
    })}`,
}

export function useTransferPositionMutation() {
  return useGovernanceMutation(TRANSFER_POSITION_CONFIG)
}

// ─── Delegation Mutations ───────────────────────────────────────────────────

const DELEGATE_POSITION_CONFIG: MutationConfig<{
  positionMints: string[]
  subDaoMint: string
  automationEnabled?: boolean
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.delegatePositions({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-delegate-${hashTagParams({
      subDao: params.subDaoMint,
      automationEnabled: params.automationEnabled ? 1 : 0,
    })}`,
  hasFetchMore: true,
}

export function useDelegatePositionMutation() {
  return useGovernanceMutation(DELEGATE_POSITION_CONFIG)
}

const EXTEND_DELEGATION_CONFIG: MutationConfig<{ positionMint: string }> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.extendDelegation({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-extendDelegation-${hashTagParams({ position: params.positionMint })}`,
}

export function useExtendDelegationMutation() {
  return useGovernanceMutation(EXTEND_DELEGATION_CONFIG)
}

const UNDELEGATE_POSITION_CONFIG: MutationConfig<{ positionMint: string }> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.undelegatePosition({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-undelegate-${hashTagParams({ position: params.positionMint })}`,
  hasFetchMore: true,
}

export function useUndelegatePositionMutation() {
  return useGovernanceMutation(UNDELEGATE_POSITION_CONFIG)
}

const CLAIM_REWARDS_CONFIG: MutationConfig<{ positionMints: string[] }> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.claimDelegationRewards({ walletAddress, ...params }),
  buildTag: (params) =>
    `gov-claimRewards-${hashTagParams({
      positions: params.positionMints.sort().join(','),
    })}`,
  hasFetchMore: true,
}

export function useClaimRewardsMutation() {
  return useGovernanceMutation(CLAIM_REWARDS_CONFIG)
}

// ─── Voting Mutations ───────────────────────────────────────────────────────

const VOTE_CONFIG: MutationConfig<{
  proposalKey: string
  positionMints: string[]
  choice: number
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.vote({ walletAddress, ...params }),
  buildTag: (params) =>
    `proposal-vote-${hashTagParams({
      proposal: params.proposalKey,
      choice: params.choice,
    })}`,
}

export function useVoteMutation() {
  return useGovernanceMutation(VOTE_CONFIG)
}

const RELINQUISH_VOTE_CONFIG: MutationConfig<{
  proposalKey: string
  positionMints: string[]
  choice: number
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.relinquishVote({ walletAddress, ...params }),
  buildTag: (params) =>
    `proposal-relinquish-${hashTagParams({
      proposal: params.proposalKey,
      choice: params.choice,
    })}`,
}

export function useRelinquishVoteMutation() {
  return useGovernanceMutation(RELINQUISH_VOTE_CONFIG)
}

const RELINQUISH_POSITION_VOTES_CONFIG: MutationConfig<{
  positionMint: string
  organization: string
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.relinquishPositionVotes({
      walletAddress,
      ...params,
    }),
  buildTag: (params) =>
    `gov-relinquish-${hashTagParams({
      position: params.positionMint,
      organization: params.organization,
    })}`,
}

export function useRelinquishPositionVotesMutation() {
  return useGovernanceMutation(RELINQUISH_POSITION_VOTES_CONFIG)
}

// ─── Proxy Mutations ────────────────────────────────────────────────────────

const ASSIGN_PROXIES_CONFIG: MutationConfig<{
  positionMints: string[]
  proxyKey: string
  expirationTime: number
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.assignProxies({ walletAddress, ...params }),
  buildTag: (params) =>
    `assign-proxy-${hashTagParams({
      proxyWallet: params.proxyKey,
      expirationTime: params.expirationTime,
      positions: params.positionMints.sort().join(','),
    })}`,
}

export function useAssignProxiesMutation() {
  return useGovernanceMutation(ASSIGN_PROXIES_CONFIG)
}

const UNASSIGN_PROXIES_CONFIG: MutationConfig<{
  positionMints: string[]
  proxyKey: string
}> = {
  apiCall: (client, walletAddress, params) =>
    client.governance.unassignProxies({ walletAddress, ...params }),
  buildTag: (params) =>
    `revoke-proxy-${hashTagParams({
      proxyKey: params.proxyKey,
      positions: params.positionMints.sort().join(','),
    })}`,
}

export function useUnassignProxiesMutation() {
  return useGovernanceMutation(UNASSIGN_PROXIES_CONFIG)
}
