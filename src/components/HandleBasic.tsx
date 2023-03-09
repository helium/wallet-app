/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { Theme } from '@theme/theme'
import Box from './Box'

type Props = BoxProps<Theme>
export default (boxProps: Props) => (
  <Box {...boxProps} alignItems="center" paddingTop="s">
    <Box
      width={58}
      height={5}
      backgroundColor="black500"
      borderRadius="round"
    />
  </Box>
)
