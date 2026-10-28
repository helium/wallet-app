export type SubmitStage = 'loading' | 'success' | 'error'

// The result shows as soon as the send settles; nothing gates it.
export const submitStage = ({
  succeeded,
  hasError,
}: {
  succeeded: boolean
  hasError: boolean
}): SubmitStage => {
  if (succeeded) return 'success'
  if (hasError) return 'error'
  return 'loading'
}
