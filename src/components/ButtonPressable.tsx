/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React, { FC, memo, useCallback } from 'react'
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { Color, FontWeight, Theme } from '../theme/theme'
import { useCreateOpacity } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'

type Props = BoxProps<Theme> & {
  backgroundColor?: Color
  backgroundColorOpacity?: number
  backgroundColorPressed?: Color
  backgroundColorOpacityPressed?: number
  Icon?: FC<SvgProps>
  innerContainerProps?: BoxProps<Theme>
  title: string
  titleColor?: Color
  titleColorOpacity?: number
  titleColorPressed?: Color
  titleColorPressedOpacity?: number
  fontSize?: number
  fontWeight?: FontWeight
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
  selected?: boolean
}

const ButtonPressable = ({
  backgroundColor,
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
  titleColorOpacity = 1,
  titleColorPressed,
  titleColorPressedOpacity = 1,
  disabled,
  selected,
  padding,
  ...boxProps
}: Props) => {
  const { backgroundStyle, colorStyle, color } = useCreateOpacity()

  const getTitleColor = useCallback(
    (pressed: boolean) => {
      if (pressed && titleColorPressed) {
        return titleColorPressed
      }
      if (titleColor) {
        return titleColor
      }
      return 'primaryText'
    },
    [titleColor, titleColorPressed],
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
      backgroundColor,
      backgroundColorOpacity,
      backgroundColorOpacityPressed,
      backgroundColorPressed,
      backgroundStyle,
      selected,
    ],
  )

  return (
    <Box overflow="hidden" {...boxProps} backgroundColor="white">
      <Pressable onPress={onPress} style={styles.pressable} disabled={disabled}>
        {({ pressed }) => (
          <Box
            height={boxProps.height}
            minHeight={boxProps.minHeight}
            maxHeight={boxProps.maxHeight}
            padding={
              boxProps.height || boxProps.maxHeight || padding ? padding : 'l'
            }
            style={getBackgroundColorStyle(pressed)}
            flexDirection="row"
            justifyContent={Icon ? 'space-between' : 'center'}
            alignItems="center"
            {...containerProps}
          >
            {title && (
              <Text
                fontSize={fontSize || 21}
                fontWeight={fontWeight}
                style={getTitleColorStyle(pressed)}
                marginHorizontal="xs"
              >
                {title}
              </Text>
            )}
            {Icon && <Icon color={getIconColor(pressed)} />}
          </Box>
        )}
      </Pressable>
    </Box>
  )
}

const styles = StyleSheet.create({ pressable: { width: '100%' } })

export default memo(ButtonPressable)
