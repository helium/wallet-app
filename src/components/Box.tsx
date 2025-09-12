import React, { forwardRef } from 'react'
import { View, ViewProps } from 'react-native'
import { createBox, BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'

const BaseBox = createBox<Theme>()

const Box = forwardRef<
  View,
  BoxProps<Theme> & ViewProps & { children?: React.ReactNode }
>((props, ref) => {
  return <BaseBox ref={ref} {...props} />
})

Box.displayName = 'Box'

export default Box
