/* eslint-disable react/jsx-props-no-spreading */
import React, { forwardRef, Ref, useMemo } from 'react'
import {
  createRestyleComponent,
  VariantProps,
  createVariant,
} from '@shopify/restyle'
import { TextInput, TextStyle } from 'react-native'
import tinycolor from 'tinycolor2'
import { SvgProps } from 'react-native-svg'
import { Color, theme, Theme } from '@theme/theme'
import { useColors, useInputVariants, useTextVariants } from '@theme/themeHooks'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from './TouchableOpacityBox'

const BoxWrapper = createRestyleComponent<
  VariantProps<Theme, 'inputVariants'> & React.ComponentProps<typeof Box>,
  Theme
>([createVariant({ themeKey: 'inputVariants' })], Box)

type Props = React.ComponentProps<typeof BoxWrapper> & {
  placeholderTextColor?: Color
  textColor?: Color
  fontSize?: number
  fontWeight?: TextStyle['fontWeight']
  floatingLabel?: string
  floatingLabelWeight?: TextStyle['fontWeight']
  optional?: boolean
  onTrailingIconPress?: () => void
  TrailingIcon?: React.FC<SvgProps>
  TrailingIconOptions?: TouchableOpacityBoxProps
  textInputProps?: React.ComponentProps<typeof TextInput>
}

const TI = forwardRef(
  (
    {
      placeholderTextColor,
      textColor,
      fontSize,
      fontWeight,
      textInputProps,
      floatingLabel,
      floatingLabelWeight,
      optional,
      TrailingIcon,
      onTrailingIconPress,
      TrailingIconOptions = {
        paddingVertical: 'm',
        paddingHorizontal: 's',
      },
      ...rest
    }: Props,
    ref: Ref<TextInput>,
  ) => {
    const colors = useColors()
    const inputVariants = useInputVariants()
    const textVariants = useTextVariants()

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
          <Box flexDirection="row" alignItems="center">
            {floatingLabel && (
              <Text
                variant="body2"
                color="grey600"
                fontWeight={floatingLabelWeight}
              >
                {floatingLabel}
              </Text>
            )}
            {optional && (
              <Text
                variant="body3"
                color="secondaryText"
                justifyContent="center"
                marginLeft="xs"
              >
                - optional
              </Text>
            )}
          </Box>
          <TextInput
            style={{
              color: getTextColor,
              fontSize: fontSize || inputVariants.regular.fontSize,
              fontWeight: fontWeight || 'bold',
              fontFamily: floatingLabel
                ? textVariants.subtitle4.fontFamily
                : undefined,
            }}
            placeholderTextColor={getPlaceholderTextColor}
            {...textInputProps}
            ref={ref}
          />
        </Box>
        {TrailingIcon && (
          <TouchableOpacityBox
            onPress={onTrailingIconPress}
            {...TrailingIconOptions}
          >
            <TrailingIcon color="white" width={14} />
          </TouchableOpacityBox>
        )}
      </BoxWrapper>
    )
  },
)

export default TI
