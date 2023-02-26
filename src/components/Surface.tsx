/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { Color, Theme } from '@theme/theme'
import { useColorScheme, useCreateOpacity } from '@theme/themeHooks'
import Box from './Box'

type Props = BoxProps<Theme> & {
  children?: (React.ReactElement | never)[] | React.ReactElement
  style?: StyleProp<ViewStyle> | undefined
}

const Surface = ({
  backgroundColor = 'surface',
  children,
  style,
  ...boxProps
}: Props) => {
  const colorScheme = useColorScheme()

  const { backgroundStyle: createBackgroundStyle } = useCreateOpacity()

  const backgroundStyle = useMemo((): ViewStyle => {
    if (!backgroundColor) return {}
    return createBackgroundStyle(
      backgroundColor as Color,
      colorScheme === 'light' ? 1 : 0.4,
    )
  }, [backgroundColor, colorScheme, createBackgroundStyle])

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      {...boxProps}
      style={style ? [style, backgroundStyle] : backgroundStyle}
    >
      {children}
    </Box>
  )
}

export default memo(Surface)
