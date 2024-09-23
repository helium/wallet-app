/* eslint-disable react/prop-types */
import { BoxProps } from '@shopify/restyle'
import React, { FC, memo, useState, useMemo } from 'react'
import { GestureResponderEvent, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDebouncedCallback } from 'use-debounce'
import { Color, FontWeight, Theme } from '@theme/theme'
import { useCreateOpacity } from '@theme/themeHooks'
import Box from './Box'
import ButtonPressAnimation from './ButtonPressAnimation'
import Text from './Text'

type Props = BoxProps<Theme> & {
  backgroundColorDisabled?: Color
  backgroundColorOpacity?: number
  backgroundColorDisabledOpacity?: number
  backgroundColorPressed?: Color
  backgroundColorOpacityPressed?: number
  Icon?: FC<SvgProps>
  innerContainerProps?: BoxProps<Theme>
  title?: string
  titleColor?: Color
  titleColorDisabled?: Color
  titleColorOpacity?: number
  titleColorPressed?: Color
  titleColorPressedOpacity?: number
  fontSize?: number
  fontWeight?: FontWeight
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
  selected?: boolean
  debounceDuration?: number
  style?: ViewStyle
  LeadingComponent?: React.ReactNode
  TrailingComponent?: React.ReactNode
}

const ButtonPressable = ({
  backgroundColor,
  backgroundColorDisabled,
  backgroundColorDisabledOpacity = 1,
  backgroundColorOpacity = 1,
  backgroundColorPressed,
  backgroundColorOpacityPressed = 1,
  fontSize,
  fontWeight,
  Icon,
  innerContainerProps: containerProps,
  onPress,
  title,
  titleColor,
  titleColorDisabled,
  titleColorOpacity = 1,
  titleColorPressed,
  titleColorPressedOpacity = 1,
  disabled,
  selected,
  padding,
  debounceDuration,
  height = 60,
  LeadingComponent,
  TrailingComponent,
  ...boxProps
}: Props) => {
  const [pressed, setPressed] = useState(false)
  const { backgroundStyle, colorStyle, color } = useCreateOpacity()

  const debouncedHandler = useDebouncedCallback(
    (event: GestureResponderEvent) => onPress?.(event),
    debounceDuration,
    { leading: true, trailing: false },
  )

  const handlePress = useMemo(() => {
    return (event: GestureResponderEvent) => {
      if (debounceDuration) {
        debouncedHandler(event)
      } else {
        onPress?.(event)
      }
    }
  }, [debounceDuration, debouncedHandler, onPress])

  const titleColorActual = useMemo(() => {
    if (disabled && titleColorDisabled) return titleColorDisabled
    if (pressed && titleColorPressed) return titleColorPressed
    if (titleColor) return titleColor
    return 'primaryText'
  }, [disabled, pressed, titleColor, titleColorDisabled, titleColorPressed])

  const titleColorStyle = useMemo(() => {
    const opacity =
      pressed && titleColorPressedOpacity
        ? titleColorPressedOpacity
        : titleColorOpacity
    return colorStyle(titleColorActual, opacity)
  }, [
    colorStyle,
    pressed,
    titleColorActual,
    titleColorOpacity,
    titleColorPressedOpacity,
  ])

  const iconColor = useMemo(() => {
    return color(titleColorActual, titleColorOpacity)
  }, [color, titleColorActual, titleColorOpacity])

  const backgroundColorStyle = useMemo(() => {
    if (disabled && backgroundColorDisabled) {
      return backgroundStyle(
        backgroundColorDisabled,
        backgroundColorDisabledOpacity,
      )
    }
    if (pressed || selected) {
      return backgroundStyle(
        backgroundColorPressed || (backgroundColor as Color) || 'primaryText',
        backgroundColorOpacityPressed,
      )
    }
    if (backgroundColor) {
      return backgroundStyle(backgroundColor as Color, backgroundColorOpacity)
    }
  }, [
    backgroundStyle,
    disabled,
    pressed,
    selected,
    backgroundColorDisabled,
    backgroundColorDisabledOpacity,
    backgroundColorPressed,
    backgroundColor,
    backgroundColorOpacityPressed,
    backgroundColorOpacity,
  ])

  return (
    <ButtonPressAnimation
      overflow="hidden"
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      {...boxProps}
    >
      <Box
        height={height}
        minHeight={boxProps.minHeight}
        maxHeight={boxProps.maxHeight}
        padding={height || boxProps.maxHeight || padding ? padding : '6'}
        style={backgroundColorStyle}
        flexDirection="row"
        justifyContent={Icon ? 'space-between' : 'center'}
        alignItems="center"
        {...containerProps}
      >
        {LeadingComponent && <Box marginEnd="xs">{LeadingComponent}</Box>}

        {title && (
          <Text
            variant="textXlMedium"
            fontSize={fontSize || 19}
            fontWeight={fontWeight}
            style={titleColorStyle}
            marginHorizontal="xs"
          >
            {title}
          </Text>
        )}
        {Icon && <Icon color={iconColor} />}
        {TrailingComponent && <Box marginStart="xs">{TrailingComponent}</Box>}
      </Box>
    </ButtonPressAnimation>
  )
}

export default memo(ButtonPressable)
