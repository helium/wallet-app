import { useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import useAppState from 'react-native-appstate-hook'
import useMount from './useMount'

type Props = { onAppear?: () => void; onDisappear?: () => void }
const useVisible = (props?: Props) => {
  const { onAppear, onDisappear } = props || {}

  const { appState } = useAppState({
    onChange: (newAppState) => handleVisibility(newAppState === 'active'),
  })
  const navigation = useNavigation()
  const [visible, setVisible] = useState(false)

  const handleVisibility = useCallback(
    (isVisible: boolean) => {
      if (isVisible === visible) return

      setVisible(isVisible)
      if (isVisible) {
        onAppear?.()
      } else {
        onDisappear?.()
      }
    },
    [visible, onAppear, onDisappear],
  )

  useMount(() => {
    handleVisibility(appState === 'active')
  })

  useEffect(() => {
    return navigation.addListener('blur', () => {
      handleVisibility(false)
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleVisibility])

  useEffect(() => {
    return navigation.addListener('focus', () => {
      handleVisibility(true)
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleVisibility])

  return visible
}

export default useVisible

type AppearProps = () => void

export const useAppear = (callback: AppearProps) => {
  // TODO: This hook needs some work to eliminate double querying
  // Right now it will query when coming out of the background and again
  // after face id is resolved. Face id causes the app state to go to
  // `inactive`, so that may be useful.
  const navigation = useNavigation()

  useAppState({ onForeground: callback })

  useMount(() => {
    callback()
  })

  useEffect(
    () => navigation.addListener('focus', callback),
    [callback, navigation],
  )
}

export const useDisappear = (callback: AppearProps) => {
  const navigation = useNavigation()

  useAppState({ onBackground: callback })

  useEffect(
    () => navigation.addListener('blur', callback),

    [callback, navigation],
  )
}
