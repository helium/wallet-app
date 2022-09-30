/* eslint-disable react/jsx-props-no-spreading */
import React, { forwardRef, Ref, useMemo } from 'react'
import {
  createRestyleComponent,
  VariantProps,
  createVariant,
  createBox,
} from '@shopify/restyle'
import { TextInput as RNTextInput } from 'react-native'
import tinycolor from 'tinycolor2'
import { Color, theme, Theme } from '../theme/theme'
import { useColors, useInputVariants } from '../theme/themeHooks'

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
  textColor?: Color
  fontSize?: number
}

const TI = forwardRef(
  (
    { placeholderTextColor, textColor, fontSize, ...rest }: Props,
    ref: Ref<RNTextInput>,
  ) => {
    const colors = useColors()
    const inputVariants = useInputVariants()

    const getPlaceholderTextColor = useMemo(() => {
      const findColor = () => {
        if (placeholderTextColor) return colors[placeholderTextColor]

        return colors[theme.inputVariants.regular.color as Color]
      }

      const color = findColor()
      if (!color) return

      return tinycolor(color).setAlpha(0.3).toRgbString()
    }, [colors, placeholderTextColor])

    const getTextColor = useMemo(() => {
      if (textColor) return colors[textColor]
      return colors.primaryText
    }, [colors, textColor])

    return (
      <TextInput
        style={{
          color: getTextColor,
          fontSize: fontSize || inputVariants.regular.fontSize,
        }}
        placeholderTextColor={getPlaceholderTextColor}
        ref={ref}
        {...rest}
      />
    )
  },
)

export default TI
