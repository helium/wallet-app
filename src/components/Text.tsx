import React from 'react'
import { Theme } from '@theme/theme'
import { getMaxFontSizeMultiplier } from '@utils/layout'
import createText from './createText'

const Text = createText<Theme>()

export default (props: TextProps) => (
  <Text maxFontSizeMultiplier={getMaxFontSizeMultiplier()} {...props} />
)

export type TextProps = React.ComponentProps<typeof Text>
