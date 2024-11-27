import { createBox } from '@shopify/restyle'
import { ReactNode } from 'react'
import { Theme } from '@config/theme/theme'
import { ScrollViewProps } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

const ScrollBox = createBox<
  Theme,
  ScrollViewProps & {
    children?: ReactNode
  }
>(ScrollView)

export default ScrollBox
