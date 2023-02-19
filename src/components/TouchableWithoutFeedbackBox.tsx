import React from 'react'
import { createBox } from '@shopify/restyle'
import {
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
} from 'react-native'
import { Theme } from '@theme/theme'
import WithDebounce from './WithDebounce'

const TouchableWithoutFeedbackBox = createBox<
  Theme,
  TouchableWithoutFeedbackProps & {
    children?: React.ReactNode
  }
>(TouchableWithoutFeedback)

export default TouchableWithoutFeedbackBox

export type TouchableOpacityBoxProps = React.ComponentProps<
  typeof TouchableWithoutFeedbackBox
>
export const DebouncedTouchableOpacityBox = WithDebounce(
  TouchableWithoutFeedbackBox,
)
