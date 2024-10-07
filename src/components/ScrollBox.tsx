import { createBox } from '@shopify/restyle'
import { ReactNode } from 'react'
import { Theme } from '@theme/theme'
import { ScrollView, ScrollViewProps } from 'react-native'

const ScrollBox = createBox<
  Theme,
  ScrollViewProps & {
    children?: ReactNode
  }
>(ScrollView)

export default ScrollBox
