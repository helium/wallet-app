import { Linking } from 'react-native'

const isHttpsUrl = (url: string) => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

// Remote content (notification markup and action links) picks the URL, so
// only https opens. Other schemes, the app's own included, can dial, run
// script or drive in-app deep links.
export const openHttpsUrl = (url: string | undefined) => {
  if (!url || !isHttpsUrl(url)) return
  void Linking.openURL(url).catch(console.error)
}
