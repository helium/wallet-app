import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-clipboard/clipboard'
import { setStringAsync } from 'expo-clipboard'
import Toast from 'react-native-simple-toast'
import useHaptic from './useHaptic'

// A caller whose pressable already fires a haptic passes haptic: false, so
// one press fires one haptic. A caller that copies a secret (seed phrase,
// private key) passes sensitive: true, so Android 13+ hides the copy from the
// clipboard preview.
export default ({
  haptic = true,
  sensitive = false,
}: { haptic?: boolean; sensitive?: boolean } = {}) => {
  const { triggerNavHaptic } = useHaptic()
  const { t } = useTranslation()

  const showToast = useCallback(
    (message: string) => {
      if (!message) return
      Toast.show(
        t('generic.copied', {
          target: message,
        }),
        Toast.SHORT,
      )
    },
    [t],
  )

  return useCallback(
    ({ copyText, message }: { copyText: string; message?: string }) => {
      if (!copyText) return

      if (sensitive) {
        setStringAsync(copyText, { android: { isSensitive: true } }).catch(
          (e) => console.warn('Clipboard.setStringAsync failed', e),
        )
      } else {
        Clipboard.setString(copyText)
      }
      const toastMessage = message ?? copyText
      showToast(toastMessage)
      if (haptic) triggerNavHaptic()
    },
    [haptic, sensitive, showToast, triggerNavHaptic],
  )
}
