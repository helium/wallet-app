/* eslint-disable react/jsx-props-no-spreading */
import React, { forwardRef, Ref, useMemo } from 'react'
import {
  createRestyleComponent,
  VariantProps,
  createVariant,
} from '@shopify/restyle'
import { TextInput } from 'react-native'
import tinycolor from 'tinycolor2'
import { SvgProps } from 'react-native-svg'
import { Color, theme, Theme } from '../theme/theme'
import { useColors, useInputVariants } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'

const BoxWrapper = createRestyleComponent<
  VariantProps<Theme, 'inputVariants'> & React.ComponentProps<typeof Box>,
  Theme
>([createVariant({ themeKey: 'inputVariants' })], Box)

type Props = React.ComponentProps<typeof BoxWrapper> & {
  placeholderTextColor?: Color
  textColor?: Color
  fontSize?: number
  fontWeight?:
    | 'bold'
    | 'normal'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | undefined
  floatingLabel?: string
  onTrailingIconPress?: () => void
  TrailingIcon?: React.FC<SvgProps>
  textInputProps?: React.ComponentProps<typeof TextInput>
}

const TI = forwardRef(
  (
    {
      placeholderTextColor,
      textColor,
      fontSize,
      textInputProps,
      floatingLabel,
      fontWeight,
      TrailingIcon,
      onTrailingIconPress,
      ...rest
    }: Props,
    ref: Ref<TextInput>,
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
      <BoxWrapper
        justifyContent="center"
        alignItems="center"
        flexDirection="row"
        {...rest}
      >
        <Box flexGrow={1} width="80%">
          {floatingLabel && (
            <Text
              variant="body2"
              fontWeight="bold"
              fontSize={12}
              color="grey600"
            >
              {floatingLabel}
            </Text>
          )}
          <TextInput
            style={{
              color: getTextColor,
              fontSize: fontSize || inputVariants.regular.fontSize,
              fontWeight,
            }}
            placeholderTextColor={getPlaceholderTextColor}
            {...textInputProps}
            ref={ref}
          />
        </Box>
        {TrailingIcon && (
          <TouchableOpacityBox
            paddingHorizontal="s"
            paddingVertical="m"
            onPress={onTrailingIconPress}
          >
            <TrailingIcon color="white" width={14} />
          </TouchableOpacityBox>
        )}
      </BoxWrapper>
    )
  },
)

export default TI
