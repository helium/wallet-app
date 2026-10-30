import { requireOptionalNativeModule } from 'expo'
import { useEffect } from 'react'
import { Platform } from 'react-native'

type SecureWindowModule = { setSecure: (secure: boolean) => Promise<void> }

// modules/secure-window: Android only, sets FLAG_SECURE on the activity window
const SecureWindow =
  requireOptionalNativeModule<SecureWindowModule>('SecureWindow')

if (Platform.OS === 'android' && !SecureWindow) {
  console.warn(
    'SecureWindow native module is missing: secret screens are not hidden from recents and screenshots',
  )
}

// secret screens that show now; the flag stays on until the last one leaves
let holders = 0

// hides the app from recents, screenshots and screen capture on Android while
// the caller shows a secret
export default (active = true) => {
  useEffect(() => {
    if (!active || Platform.OS !== 'android' || !SecureWindow) return undefined

    holders += 1
    if (holders === 1) {
      SecureWindow.setSecure(true).catch((e) =>
        console.warn('SecureWindow.setSecure(true) failed', e),
      )
    }
    return () => {
      holders -= 1
      if (holders === 0) {
        SecureWindow.setSecure(false).catch((e) =>
          console.warn('SecureWindow.setSecure(false) failed', e),
        )
      }
    }
  }, [active])
}
