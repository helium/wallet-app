/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React, { memo, useCallback } from 'react'
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import ArrowDown from '@assets/images/downArrow.svg'
import FatArrowUp from '@assets/images/arrowUp.svg'
import Payment from '@assets/images/payment.svg'
import Stake from '@assets/images/stake.svg'
import Lock from '@assets/images/lock.svg'
import Plus from '@assets/images/plus.svg'
import Vote from '@assets/images/vote-thumbs.svg'
import Close from '@assets/images/close.svg'
import Dots from '@assets/images/dots.svg'
import Filter from '@assets/images/filter.svg'
import Buy from '@assets/images/buy.svg'
import { Color, FontWeight, Theme } from '../theme/theme'
import { useColors, useCreateOpacity } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'

type IconName =
  | 'arrowDown'
  | 'arrowRight'
  | 'fatArrowUp'
  | 'fatArrowDown'
  | 'payment'
  | 'stake'
  | 'lock'
  | 'add'
  | 'vote'
  | 'close'
  | 'dots'
  | 'filter'
  | 'buy'

type Props = BoxProps<Theme> & {
  backgroundColor?: Color
  backgroundColorOpacity?: number
  backgroundColorPressed?: Color
  backgroundColorOpacityPressed?: number
  icon?: IconName
  innerContainerProps?: BoxProps<Theme>
  iconColor?: Color
  iconColorPressed?: Color
  fontSize?: number
  fontWeight?: FontWeight
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  size?: number
  disabled?: boolean
  title?: string
  reverse?: boolean
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
  visible = true,
  reverse = false,
  ...boxProps
}: Props) => {
  const { backgroundStyle } = useCreateOpacity()

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

  if (title) {
    return (
      <Box visible={visible} marginHorizontal="s">
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          disabled={disabled}
        >
          {({ pressed }) => (
            <Box
              style={getBackgroundColorStyle(pressed)}
              height={size}
              alignItems="center"
              justifyContent="center"
              flexDirection={reverse ? 'row-reverse' : 'row'}
              paddingHorizontal="m"
              borderRadius="round"
              {...containerProps}
            >
              {icon && (
                <Box paddingHorizontal="xs">
                  <FabIcon
                    icon={icon}
                    pressed={pressed}
                    color={iconColor}
                    colorPressed={iconColorPressed}
                  />
                </Box>
              )}
              <Text
                variant="subtitle2"
                color={iconColor}
                paddingHorizontal="xs"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {title}
              </Text>
            </Box>
          )}
        </Pressable>
      </Box>
    )
  }

  return (
    <Box
      overflow="hidden"
      height={size}
      width={size}
      {...boxProps}
      borderRadius="round"
      visible={visible}
    >
      <Pressable onPress={onPress} style={styles.pressable} disabled={disabled}>
        {({ pressed }) => (
          <FabButtonCircle
            pressed={pressed}
            size={size}
            icon={icon}
            iconColor={iconColor}
            iconColorPressed={iconColorPressed}
            props={containerProps}
            style={getBackgroundColorStyle(pressed)}
          />
        )}
      </Pressable>
    </Box>
  )
}

type FabButtonCircleProps = {
  pressed: boolean
  size?: number
  icon?: IconName
  iconColor?: Color
  iconColorPressed?: Color
  props?: BoxProps<Theme>
  style?: ViewStyle
}

const FabButtonCircle = ({
  pressed,
  size,
  icon,
  iconColor,
  iconColorPressed,
  props,
  style,
}: FabButtonCircleProps) => {
  return (
    <Box
      style={style}
      height={size}
      width={size}
      alignItems="center"
      justifyContent="center"
      {...props}
    >
      <FabIcon
        icon={icon}
        pressed={pressed}
        color={iconColor}
        colorPressed={iconColorPressed}
      />
    </Box>
  )
}

type IconProps = {
  icon?: IconName
  pressed: boolean
  color?: Color
  colorPressed?: Color
}

const FabIcon = ({ icon, pressed, color, colorPressed }: IconProps) => {
  const colors = useColors()

  const getIconColor = useCallback(() => {
    if (pressed && colorPressed) {
      return colors[colorPressed]
    }

    if (color) {
      return colors[color]
    }

    return colors.primaryText
  }, [color, colorPressed, colors, pressed])

  switch (icon) {
    case 'arrowRight':
      return (
        <ArrowDown
          color={getIconColor()}
          style={{ transform: [{ rotate: '270deg' }] }}
        />
      )
    case 'arrowDown':
      return <ArrowDown color={getIconColor()} />
    case 'fatArrowUp':
      return <FatArrowUp color={getIconColor()} />
    case 'fatArrowDown':
      return (
        <FatArrowUp
          color={getIconColor()}
          style={{ transform: [{ rotate: '180deg' }] }}
        />
      )
    case 'payment':
      return <Payment color={getIconColor()} />
    case 'stake':
      return <Stake color={getIconColor()} />
    case 'lock':
      return <Lock color={getIconColor()} />
    case 'add':
      return <Plus color={getIconColor()} />
    case 'vote':
      return <Vote color={getIconColor()} />
    case 'close':
      return <Close color={getIconColor()} />
    case 'filter':
      return <Filter color={getIconColor()} />
    case 'buy':
      return <Buy color={getIconColor()} />
    default:
    case 'dots':
      return <Dots color={getIconColor()} />
  }
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    alignItems: 'center',
  },
})

export default memo(ButtonPressable)
