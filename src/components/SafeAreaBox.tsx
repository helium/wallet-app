import { createBox } from '@shopify/restyle'
import { Platform } from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { Theme } from '@theme/theme'

const SafeAreaBox = createBox<Theme, React.ComponentProps<typeof SafeAreaView>>(
  SafeAreaView,
)

export default SafeAreaBox

export const useModalSafeAreaEdges = () => {
  if (Platform.OS === 'android') return ['top', 'bottom'] as Edge[]
  return ['bottom'] as Edge[]
}

export const useModalTopSafeAreaEdges = () => {
  if (Platform.OS === 'android') return ['top'] as Edge[]
  return undefined
}
