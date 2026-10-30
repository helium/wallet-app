import { BatchStatus } from '../../../hooks/useTransactionBatchStatus'

// Every terminal batch status other than 'confirmed' is an error, so the
// submit view never stays loading once the batch settles.
export const batchSubmitError = (
  status: BatchStatus | undefined,
): Error | undefined => {
  switch (status) {
    case undefined:
    case 'pending':
    case 'confirmed':
      return undefined
    case 'failed':
      return new Error('Transaction failed')
    case 'expired':
      return new Error('Transaction expired')
    case 'partial':
      // Some transactions landed; a blind retry can send them twice.
      return new Error(
        'Some transactions failed. Check your activity before you retry.',
      )
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
