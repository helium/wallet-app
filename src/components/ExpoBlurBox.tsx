import { createBox } from '@shopify/restyle'
import { BlurView, BlurViewProps } from 'expo-blur'

import { Theme } from '../theme/theme'

const ExpoBlurBox = createBox<
  Theme,
  BlurViewProps & {
    children?: React.ReactNode
  }
>(BlurView)

export default ExpoBlurBox
