import { NavBarHeight } from '@components/ServiceNavBar'
import { useSpacing } from '@config/theme/themeHooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useBottomSpacing = () => {
  const { bottom } = useSafeAreaInsets()
  const spacing = useSpacing()

  return (bottom || spacing['2xl']) + NavBarHeight + spacing.xs
}
