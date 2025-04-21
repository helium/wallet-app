import { createBox } from '@shopify/restyle'
import { BlurView, BlurViewProps } from 'expo-blur'
import { ReactNode } from 'react'
import { Theme } from '@theme/theme'

const BlurBox = createBox<
  Theme,
  BlurViewProps & {
    children?: ReactNode
  }
>(BlurView)

export default BlurBox
