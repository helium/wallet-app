const originOf = (url: string | undefined) => {
  try {
    const { origin } = new URL(url ?? '')
    return origin === 'null' ? undefined : origin
  } catch {
    return undefined
  }
}

// True when a webview message came from a frame on the top page's origin.
// Every frame can post to the native bridge, but only the top frame gets the
// wallet provider, so a message from another origin is not the dApp's.
export const isSameOrigin = (
  frameUrl: string | undefined,
  topUrl: string,
): boolean => {
  const frameOrigin = originOf(frameUrl)
  return frameOrigin !== undefined && frameOrigin === originOf(topUrl)
}
