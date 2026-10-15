// Tracks the one pending sign request. A new request settles the previous
// one as declined, so its awaited promise cannot hang. Each request settles
// once.
export const createSignRequestResolver = () => {
  let resolve: ((value: boolean) => void) | null = null
  return {
    next: (): Promise<boolean> => {
      resolve?.(false)
      return new Promise<boolean>((r) => {
        resolve = r
      })
    },
    // Returns false when no request was pending
    settle: (value: boolean): boolean => {
      const pending = resolve
      resolve = null
      pending?.(value)
      return !!pending
    },
  }
}
