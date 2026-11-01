export const CHECK_ACTIVITY_MESSAGE =
  'Could not confirm which transactions went through. Check your activity.'

// The submit of signed transactions failed with no answer the app can trust:
// the transactions may still have landed, so they must not be signed again.
export class UnconfirmedSubmitError extends Error {
  readonly cause: unknown

  constructor(cause: unknown) {
    super(CHECK_ACTIVITY_MESSAGE)
    this.name = 'UnconfirmedSubmitError'
    this.cause = cause
  }
}
