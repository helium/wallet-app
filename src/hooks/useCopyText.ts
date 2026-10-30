import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-clipboard/clipboard'
import Toast from 'react-native-simple-toast'
import useHaptic from './useHaptic'

// A caller whose pressable already fires a haptic passes haptic: false, so
// one press fires one haptic.
export default ({ haptic = true }: { haptic?: boolean } = {}) => {
  const { triggerNavHaptic } = useHaptic()
  const { t } = useTranslation()

  const showToast = useCallback(
    (message: string) => {
      if (!message) return
      Toast.show(
        t('generic.copied', {
          target: message,
        }),
      )
    },
    [t],
  )

  return useCallback(
    ({ copyText, message }: { copyText: string; message?: string }) => {
      if (!copyText) return

      Clipboard.setString(copyText)
      const toastMessage = message ?? copyText
      showToast(toastMessage)
      if (haptic) triggerNavHaptic()
    },
    [haptic, showToast, triggerNavHaptic],
  )
}
