// The submit of signed transactions failed with no answer the app can trust:
// the transactions may still have landed, so they must not be signed again.
export class UnconfirmedSubmitError extends Error {
  readonly cause: unknown

  constructor(cause: unknown) {
    super(
      'Could not confirm which transactions went through. Check your activity.',
    )
    this.name = 'UnconfirmedSubmitError'
    this.cause = cause
  }
}
