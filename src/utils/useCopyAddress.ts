import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import useHaptic from './useHaptic'
import { ellipsizeAddress } from './accountUtils'

export default () => {
  const { triggerNavHaptic } = useHaptic()
  const { t } = useTranslation()

  const showToast = useCallback(
    (address: string) => {
      if (!address) return
      Toast.show(
        t('generic.copied', {
          target: ellipsizeAddress(address),
        }),
      )
    },
    [t],
  )

  return useCallback(
    (address: string) => {
      if (!address) return

      Clipboard.setString(address)
      showToast(address)
      triggerNavHaptic()
    },
    [showToast, triggerNavHaptic],
  )
}
