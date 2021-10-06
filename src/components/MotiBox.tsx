import { createBox } from '@shopify/restyle'
import { View } from 'moti'
import { Theme } from '../theme/theme'
import 'react-native-reanimated'

const MotiBox = createBox<Theme, React.ComponentProps<typeof View>>(View)

export default MotiBox
