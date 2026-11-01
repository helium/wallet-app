import type { fullApiContract } from '@helium/blockchain-api'
import type { ContractRouterClient } from '@orpc/contract'
import { submitFailure } from './submitFailure'

type BlockchainApiClient = ContractRouterClient<typeof fullApiContract>

// Submits signed transactions. A submit that fails may still have sent them,
// so it throws submitFailure's error, never the raw rejection.
export const submitSigned = (
  client: BlockchainApiClient,
  signed: Parameters<BlockchainApiClient['transactions']['submit']>[0],
) =>
  client.transactions.submit(signed).catch((e: unknown) => {
    throw submitFailure(e)
  })
