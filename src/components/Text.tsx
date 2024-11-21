import React from 'react'
import { Theme } from '@config/theme/theme'
import createText from './createText'

const Text = createText<Theme>()

export default (props: TextProps) => (
  <Text maxFontSizeMultiplier={1.3} {...props} />
)

export type TextProps = React.ComponentProps<typeof Text>
