import React from 'react'
import createText from './createText'
import { Theme } from '../theme/theme'

const Text = createText<Theme>()

export default (props: TextProps) => (
  <Text maxFontSizeMultiplier={1.3} {...props} />
)

export type TextProps = React.ComponentProps<typeof Text>
