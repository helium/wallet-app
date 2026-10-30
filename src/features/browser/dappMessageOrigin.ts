// Never an opaque 'null' origin
export type DappOrigin = string & { readonly __brand: 'DappOrigin' }

// Every frame can post to the native bridge, so a request is shown under the
// origin of the frame that sent it, never the top page's
export const senderOrigin = (
  senderUrl: string | undefined,
): DappOrigin | undefined => {
  try {
    const { origin } = new URL(senderUrl ?? '')
    return origin === 'null' ? undefined : (origin as DappOrigin)
  } catch {
    return undefined
  }
}
