/* eslint-disable react/prop-types */
import { BoxProps } from '@shopify/restyle'
import React, { FC, memo, useCallback } from 'react'
import { GestureResponderEvent, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDebouncedCallback } from 'use-debounce'
import { Color, FontWeight, Theme } from '@theme/theme'
import { useCreateOpacity } from '@theme/themeHooks'
import Box from './Box'
import ButtonPressAnimation from './ButtonPressAnimation'
import Text from './Text'

type Props = BoxProps<Theme> & {
  backgroundColor?: Color
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
  const debouncedHandler = useDebouncedCallback(
    (event: GestureResponderEvent) => onPress?.(event),
    debounceDuration,
    { leading: true, trailing: false },
  )

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (debounceDuration) {
        debouncedHandler(event)
      } else {
        onPress?.(event)
      }
    },
    [debounceDuration, debouncedHandler, onPress],
  )

  const { backgroundStyle, colorStyle, color } = useCreateOpacity()

  const getTitleColor = useCallback(
    (pressed: boolean) => {
      if (disabled && titleColorDisabled) {
        return titleColorDisabled
      }
      if (pressed && titleColorPressed) {
        return titleColorPressed
      }
      if (titleColor) {
        return titleColor
      }
      return 'primaryText'
    },
    [disabled, titleColor, titleColorDisabled, titleColorPressed],
  )

  const getTitleColorStyle = useCallback(
    (pressed: boolean) => {
      return colorStyle(
        getTitleColor(pressed),
        pressed && titleColorPressedOpacity
          ? titleColorPressedOpacity
          : titleColorOpacity,
      )
    },
    [colorStyle, getTitleColor, titleColorOpacity, titleColorPressedOpacity],
  )

  const getIconColor = useCallback(
    (pressed: boolean) => {
      const c = getTitleColor(pressed)
      return color(c, titleColorOpacity)
    },
    [color, getTitleColor, titleColorOpacity],
  )

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (disabled && backgroundColorDisabled) {
        return backgroundStyle(
          backgroundColorDisabled,
          backgroundColorDisabledOpacity,
        )
      }
      if (pressed || selected) {
        return backgroundStyle(
          backgroundColorPressed || backgroundColor || 'white',
          backgroundColorOpacityPressed,
        )
      }

      if (!pressed && backgroundColor) {
        return backgroundStyle(backgroundColor, backgroundColorOpacity)
      }
    },
    [
      disabled,
      backgroundColorDisabled,
      selected,
      backgroundColor,
      backgroundStyle,
      backgroundColorDisabledOpacity,
      backgroundColorPressed,
      backgroundColorOpacityPressed,
      backgroundColorOpacity,
    ],
  )

  return (
    <ButtonPressAnimation
      overflow="hidden"
      onPress={handlePress}
      disabled={disabled}
      {...boxProps}
    >
      {({ pressed }: { pressed: boolean }) => (
        <Box
          height={height}
          minHeight={boxProps.minHeight}
          maxHeight={boxProps.maxHeight}
          padding={height || boxProps.maxHeight || padding ? padding : 'l'}
          style={getBackgroundColorStyle(pressed)}
          flexDirection="row"
          justifyContent={Icon ? 'space-between' : 'center'}
          alignItems="center"
          {...containerProps}
        >
          {LeadingComponent && <Box marginEnd="xs">{LeadingComponent}</Box>}

          {title && (
            <Text
              variant="subtitle1"
              fontSize={fontSize || 19}
              fontWeight={fontWeight}
              style={getTitleColorStyle(pressed)}
              marginHorizontal="xs"
            >
              {title}
            </Text>
          )}
          {Icon && <Icon color={getIconColor(pressed)} />}
          {TrailingComponent && <Box marginStart="xs">{TrailingComponent}</Box>}
        </Box>
      )}
    </ButtonPressAnimation>
  )
}

export default memo(ButtonPressable)
