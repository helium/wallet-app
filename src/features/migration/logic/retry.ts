// Pure decision helpers for the migration flow's error/retry states, extracted
// so their schedules/thresholds can be unit-tested without React.

// OTP resend backoff: 30s on the first send, doubling per resend, capped at
// 300s. `count` is the resend index (0 for the initial send).
export const resendBackoffSeconds = (count: number): number =>
  Math.min(30 * 2 ** count, 300)

// Destination wallet creation offers Retry immediately; the support path only
// appears once creation has failed at least 3 times.
export const shouldShowSupport = (attempts: number): boolean => attempts >= 3
