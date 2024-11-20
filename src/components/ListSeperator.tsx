import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { Theme } from '@theme/theme'
import Box from './Box'

const ListSeparator = (props: BoxProps<Theme>) => (
  <Box height={1} backgroundColor="secondaryText" {...props} />
)

export default ListSeparator
