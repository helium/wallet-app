import { BatchFailure } from './batchFailure'

// What Retry sends: the failed items of a settled batch; else the set the last
// failed submit was sending, or every item when nothing was sent yet.
// Undefined when the app cannot tell what landed, so no Retry is offered.
export const retrySet = <T>(
  failure: BatchFailure<T> | undefined,
  unsent: T[] | undefined,
  all: T[],
): T[] | undefined => {
  if (!failure) return unsent ?? all
  switch (failure.kind) {
    case 'retry':
      return failure.failed
    case 'checkActivity':
      return undefined
    default: {
      const _exhaustive: never = failure
      return _exhaustive
    }
  }
}
