import {
  useProposalConfig,
  useResolutionSettings,
} from '@helium/modular-governance-hooks'
import { ProposalWithVotes } from '@helium/voter-stake-registry-sdk'
import { PublicKey } from '@solana/web3.js'
import { getDerivedProposalState } from '@utils/governanceUtils'
import BN from 'bn.js'
import { useMemo } from 'react'
import { ProposalV0 } from '../features/governance/governanceTypes'

function usePublicKey(
  key: string | PublicKey | undefined,
): PublicKey | undefined {
  return useMemo(() => {
    if (key) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (key.toBase58) {
        return key as PublicKey
      }
      return new PublicKey(key)
    }
  }, [key])
}

export function useProposalStatus(proposal?: ProposalV0 | ProposalWithVotes) {
  const { info: proposalConfig, loading: loadingConfig } = useProposalConfig(
    usePublicKey(proposal?.proposalConfig),
  )
  const { info: resolution, loading: loadingResolution } =
    useResolutionSettings(proposalConfig?.stateController)
  const derivedState = useMemo(
    () => getDerivedProposalState(proposal as ProposalV0),
    [proposal],
  )

  const endTs =
    resolution &&
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (proposal?.state.resolved
      ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new BN(proposal?.state.resolved.endTs)
      : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new BN(proposal?.state.voting?.startTs).add(
          resolution.settings.nodes.find(
            (node) => typeof node.offsetFromStartTs !== 'undefined',
          )?.offsetFromStartTs?.offset ?? new BN(0),
        ))

  const timeExpired = endTs && endTs.toNumber() <= Date.now().valueOf() / 1000
  const isLoading = loadingConfig || loadingResolution
  const isActive = derivedState === 'active'
  const isCancelled = derivedState === 'cancelled'
  const isFailed = derivedState === 'failed'
  const completed =
    timeExpired || (timeExpired && isActive) || isCancelled || isFailed

  const votingResults = useMemo(() => {
    const totalVotes: BN = [...(proposal?.choices || [])].reduce(
      (acc, { weight }) => new BN(weight).add(acc) as BN,
      new BN(0),
    )

    const results = proposal?.choices.map((r, index) => ({
      ...r,
      index,
      percent: totalVotes?.isZero()
        ? 100 / proposal?.choices.length
        : // Calculate with 4 decimals of precision
          new BN(r.weight).mul(new BN(10000)).div(totalVotes).toNumber() *
          (100 / 10000),
    }))

    return { results, totalVotes }
  }, [proposal])

  return {
    isLoading,
    isActive,
    isCancelled,
    isFailed,
    completed,
    timeExpired,
    resolution,
    endTs,
    votingResults,
  }
}
