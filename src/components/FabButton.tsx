/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React, { memo, useCallback } from 'react'
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native'
import ArrowDown from '@assets/images/downArrow.svg'
import FatArrowUp from '@assets/images/arrowUp.svg'
import Payment from '@assets/images/payment.svg'
import Stake from '@assets/images/stake.svg'
import Lock from '@assets/images/lock.svg'
import { Color, FontWeight, Theme } from '../theme/theme'
import { useColors, useCreateOpacity } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'

type Props = BoxProps<Theme> & {
  backgroundColor?: Color
  backgroundColorOpacity?: number
  backgroundColorPressed?: Color
  backgroundColorOpacityPressed?: number
  icon:
    | 'arrowDown'
    | 'arrowRight'
    | 'fatArrowUp'
    | 'fatArrowDown'
    | 'payment'
    | 'arrowDown'
    | 'stake'
    | 'lock'
  innerContainerProps?: BoxProps<Theme>
  iconColor?: Color
  iconColorPressed?: Color
  fontSize?: number
  fontWeight?: FontWeight
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  size?: number
  disabled?: boolean
  title?: string
}

const ButtonPressable = ({
  backgroundColor,
  backgroundColorOpacity = 1,
  backgroundColorPressed,
  backgroundColorOpacityPressed = 1,
  icon,
  innerContainerProps: containerProps,
  onPress,
  iconColor,
  iconColorPressed,
  size = 56,
  disabled,
  title,
  ...boxProps
}: Props) => {
  const { backgroundStyle } = useCreateOpacity()
  const colors = useColors()

  const getIconColor = useCallback(
    (pressed: boolean) => {
      const color = () => {
        if (pressed && iconColorPressed) {
          return iconColorPressed
        }
        if (iconColor) {
          return iconColor
        }
        return 'primaryText'
      }
      return colors[color()]
    },
    [colors, iconColor, iconColorPressed],
  )

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
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
    ],
  )

  const getIcon = useCallback(
    (pressed: boolean) => {
      switch (icon) {
        case 'arrowRight':
          return (
            <ArrowDown
              color={getIconColor(pressed)}
              style={{ transform: [{ rotate: '270deg' }] }}
            />
          )
        case 'arrowDown':
          return <ArrowDown color={getIconColor(pressed)} />
        case 'fatArrowUp':
          return <FatArrowUp color={getIconColor(pressed)} />
        case 'fatArrowDown':
          return (
            <FatArrowUp
              color={getIconColor(pressed)}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          )
        case 'payment':
          return <Payment color={getIconColor(pressed)} />
        case 'stake':
          return <Stake color={getIconColor(pressed)} />
        case 'lock':
          return <Lock color={getIconColor(pressed)} />
      }
    },
    [getIconColor, icon],
  )

  return (
    <Box alignItems="center">
      <Box
        overflow="hidden"
        height={size}
        width={size}
        {...boxProps}
        borderRadius="round"
      >
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          disabled={disabled}
        >
          {({ pressed }) => (
            <Box
              style={getBackgroundColorStyle(pressed)}
              height={size}
              width={size}
              alignItems="center"
              justifyContent="center"
              {...containerProps}
            >
              {getIcon(pressed)}
            </Box>
          )}
        </Pressable>
      </Box>
      {title && (
        <Text variant="body2" color="grey800" marginTop="s">
          {title}
        </Text>
      )}
    </Box>
  )
}

const styles = StyleSheet.create({ pressable: { width: '100%' } })

export default memo(ButtonPressable)
