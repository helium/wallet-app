import { BoxProps } from '@shopify/restyle'
import React, { memo } from 'react'
import { StyleSheet } from 'react-native'
import { Theme } from '@theme/theme'
import Box from './Box'

type Props = BoxProps<Theme>
const BackgroundFill = ({ opacity, backgroundColor, ...boxProps }: Props) => (
  <Box
    backgroundColor={backgroundColor || 'error'}
    opacity={opacity || 0.4}
    style={StyleSheet.absoluteFill}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...boxProps}
  />
)
export default memo(BackgroundFill)
