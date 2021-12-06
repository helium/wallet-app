/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react'
import {
  createRestyleComponent,
  VariantProps,
  createVariant,
  createBox,
} from '@shopify/restyle'
import { TextInput as RNTextInput } from 'react-native'
import tinycolor from 'tinycolor2'
import { Color, theme, Theme } from '../theme/theme'
import { useColors } from '../theme/themeHooks'

const TextInputBox = createBox<Theme, React.ComponentProps<typeof RNTextInput>>(
  RNTextInput,
)

const TextInput = createRestyleComponent<
  VariantProps<Theme, 'inputVariants'> &
    React.ComponentProps<typeof TextInputBox>,
  Theme
>([createVariant({ themeKey: 'inputVariants' })], TextInputBox)

type Props = React.ComponentProps<typeof TextInput> & {
  placeholderTextColor?: Color
}

const TI = ({ placeholderTextColor, ...rest }: Props) => {
  const colors = useColors()

  const getPlaceholderTextColor = useMemo(() => {
    const findColor = () => {
      if (placeholderTextColor) return colors[placeholderTextColor]

      return colors[theme.inputVariants.regular.color as Color]
    }

    const color = findColor()
    if (!color) return

    return tinycolor(color).setAlpha(0.3).toRgbString()
  }, [colors, placeholderTextColor])

  return <TextInput placeholderTextColor={getPlaceholderTextColor} {...rest} />
}

export default TI
