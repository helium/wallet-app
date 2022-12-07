import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import useHaptic from './useHaptic'

export default () => {
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
      triggerNavHaptic()
    },
    [showToast, triggerNavHaptic],
  )
}
