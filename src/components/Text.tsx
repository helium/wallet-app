import React from 'react'
import { useWindowDimensions } from 'react-native'
import { Theme } from '@theme/theme'
import { getMaxFontSizeMultiplier } from '@utils/layout'
import createText from './createText'

const Text = createText<Theme>()

export default (props: TextProps) => {
  const window = useWindowDimensions()
  return (
    <Text maxFontSizeMultiplier={getMaxFontSizeMultiplier(window)} {...props} />
  )
}

export type TextProps = React.ComponentProps<typeof Text>
