import type { fullApiContract } from '@helium/blockchain-api'
import { ORPCError } from '@orpc/client'
import { UnconfirmedSubmitError } from './unconfirmedSubmitError'

type SubmitRejectionCode =
  keyof (typeof fullApiContract)['transactions']['submit']['~orpc']['errorMap']

// The defined submit rejections the server raises before it sends any
// transaction. It reports a failed or lost send as BAD_REQUEST, so that code
// is not here.
const UNSENT_REJECTIONS: readonly SubmitRejectionCode[] = [
  'SIMULATION_FAILED',
  'BLOCKHASH_EXPIRED',
]

// The error to throw when the submit of signed transactions fails: a rejection
// that proves nothing was sent keeps its reason, so Retry may sign again. Any
// other failure may have landed the transactions.
export const submitFailure = (error: unknown): Error =>
  error instanceof ORPCError &&
  error.defined &&
  UNSENT_REJECTIONS.includes(error.code)
    ? error
    : new UnconfirmedSubmitError(error)
