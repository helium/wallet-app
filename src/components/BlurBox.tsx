import React from 'react'
import { createBox } from '@shopify/restyle'
import { BlurView, BlurViewProps } from '@react-native-community/blur'

import { Theme } from '@theme/theme'

const BlurBox = createBox<
  Theme,
  BlurViewProps & {
    children?: React.ReactNode
  }
>(BlurView)

export default BlurBox
