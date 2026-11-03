import { Linking } from 'react-native'
import { HELIUM_WALLET_LINK_SCHEME } from './walletLinkScheme'

const WALLET_LINK_HOST = new URL(HELIUM_WALLET_LINK_SCHEME).hostname

const parseUrl = (url: string) => {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

const isOpenableRemoteUrl = (url: URL) =>
  url.protocol === 'https:' &&
  url.hostname.toLowerCase().replace(/\.+$/, '') !== WALLET_LINK_HOST

// Remote content (notification markup and action links) picks the URL, so
// only https opens, except the wallet's own app-link host. That host and the
// app's own scheme both drive in-app deep links; other schemes can dial or
// run script.
export const openHttpsUrl = (url: string | undefined) => {
  if (!url) return
  const parsed = parseUrl(url)
  if (!parsed || !isOpenableRemoteUrl(parsed)) {
    // The protocol only: the full URL can carry a key
    console.warn('Blocked a link', parsed?.protocol ?? 'unparsable')
    return
  }
  void Linking.openURL(url).catch(console.error)
}
