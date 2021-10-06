import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'

const useAlert = () => {
  const { t } = useTranslation()

  const showOKAlert = useCallback(
    (options: {
      title: string
      message?: string
      ok?: string
    }): Promise<boolean> =>
      new Promise((resolve) => {
        const { title, message, ok } = options
        Alert.alert(title, message, [
          {
            text: ok || t('generic.ok'),
            onPress: () => resolve(true),
          },
        ])
      }),
    [t],
  )

  const showOKCancelAlert = useCallback(
    (options: {
      title: string
      message?: string
      ok?: string
      cancel?: string
      cancelStyle?: 'destructive' | 'cancel'
    }): Promise<boolean> =>
      new Promise((resolve) => {
        const {
          title,
          message,
          ok,
          cancel,
          cancelStyle = 'destructive',
        } = options
        Alert.alert(title, message, [
          {
            text: cancel || t('generic.cancel'),
            style: cancelStyle,
            onPress: () => resolve(false),
          },
          {
            text: ok || t('generic.ok'),
            onPress: () => resolve(true),
          },
        ])
      }),
    [t],
  )

  return { showOKCancelAlert, showOKAlert }
}

export default useAlert
