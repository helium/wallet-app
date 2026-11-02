import { UnconfirmedSubmitError } from '../../utils/unconfirmedSubmitError'

// The error a failed swap reports. An unconfirmed submit keeps its own
// message: the swap may have landed.
export const swapError = (token: string, err: unknown): Error =>
  err instanceof UnconfirmedSubmitError
    ? err
    : new Error(`Failed to swap ${token}: ${(err as Error).message}`)
