import { requireOptionalNativeModule } from 'expo'
import { useEffect } from 'react'
import { Platform } from 'react-native'

type SecureWindowModule = { setSecure: (secure: boolean) => Promise<void> }

// modules/secure-window: Android only, sets FLAG_SECURE on the activity window
const SecureWindow =
  requireOptionalNativeModule<SecureWindowModule>('SecureWindow')

// secret screens that show now; the flag stays on until the last one leaves
let holders = 0

// hides the app from recents, screenshots and screen capture on Android while
// the caller shows a secret
export default (active = true) => {
  useEffect(() => {
    if (!active || Platform.OS !== 'android' || !SecureWindow) return undefined

    holders += 1
    if (holders === 1) SecureWindow.setSecure(true)
    return () => {
      holders -= 1
      if (holders === 0) SecureWindow.setSecure(false)
    }
  }, [active])
}
