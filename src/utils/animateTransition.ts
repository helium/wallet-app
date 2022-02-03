import { useCallback, useState } from 'react'
import { LayoutAnimation, LayoutAnimationConfig, Platform } from 'react-native'
import Config from 'react-native-config'

type AnimationOptions = {
  enabledOnAndroid: boolean
  config?: LayoutAnimationConfig
  onAnimationDidEnd?: () => void
}
const animateTransition = (
  id: string,
  { enabledOnAndroid, config, onAnimationDidEnd }: AnimationOptions = {
    enabledOnAndroid: true,
    config: LayoutAnimation.Presets.easeInEaseOut,
  },
) => {
  if (Platform.OS === 'android' && !enabledOnAndroid) return

  if (__DEV__ && Config.LOG_ANIMATIONS === 'true') {
    // eslint-disable-next-line no-console
    console.log('animateTransition:', { id, enabledOnAndroid })
  }

  LayoutAnimation.configureNext(
    config || LayoutAnimation.Presets.easeInEaseOut,
    onAnimationDidEnd,
  )
}

export const useAnimateTransition = () => {
  const [isAnimating, setIsAnimating] = useState(false)

  const animate = useCallback(
    (
      id: string,
      opts: AnimationOptions = {
        enabledOnAndroid: true,
        config: LayoutAnimation.Presets.easeInEaseOut,
      },
    ) => {
      setIsAnimating(true)

      const onAnimationDidEnd = () => {
        opts?.onAnimationDidEnd?.()
        setIsAnimating(false)
      }

      animateTransition(id, { ...opts, onAnimationDidEnd })
    },
    [],
  )

  return { isAnimating, animate }
}

export default animateTransition
