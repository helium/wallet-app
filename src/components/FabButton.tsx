/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React, { memo, useCallback, useMemo, useState } from 'react'
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import ArrowDown from '@assets/svgs/arrowDown.svg'
import Settings from '@assets/svgs/settings.svg'
import FatArrowUp from '@assets/svgs/arrowUp.svg'
import Payment from '@assets/svgs/payment.svg'
import Stake from '@assets/svgs/stake.svg'
import Lock from '@assets/svgs/lock.svg'
import Plus from '@assets/svgs/plus.svg'
import Close from '@assets/svgs/close.svg'
import Dots from '@assets/svgs/dots.svg'
import Filter from '@assets/svgs/filter.svg'
import { Color, FontWeight, Theme } from '@config/theme/theme'
import { useColors, useCreateOpacity } from '@config/theme/themeHooks'
import Swaps from '@assets/svgs/swaps.svg'
import Airdrop from '@assets/svgs/airdrop.svg'
import MapUserLocation from '@assets/svgs/mapUserLocation.svg'
import Search from '@assets/svgs/search.svg'
import Info from '@assets/svgs/info.svg'
import QuestionMark from '@assets/svgs/questionMark.svg'
import BrowseVoters from '@assets/svgs/browseVoters.svg'
import Expand from '@assets/svgs/expand.svg'
import Box from './Box'
import Text from './Text'
import ButtonPressAnimation from './ButtonPressAnimation'

type IconName =
  | 'arrowDown'
  | 'arrowRight'
  | 'fatArrowUp'
  | 'fatArrowDown'
  | 'payment'
  | 'stake'
  | 'lock'
  | 'add'
  | 'close'
  | 'dots'
  | 'filter'
  | 'swaps'
  | 'airdrop'
  | 'mapUserLocation'
  | 'search'
  | 'info'
  | 'questionMark'
  | 'browseVoters'
  | 'expand'
  | 'settings'
  | 'arrowLeft'
type Props = BoxProps<Theme> & {
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
  const [pressed, setPressed] = useState(false)
  const { backgroundStyle } = useCreateOpacity()

  const backgroundColorStyle = useMemo(() => {
    if (pressed) {
      return backgroundStyle(
        backgroundColorPressed || (backgroundColor as Color) || 'primaryText',
        backgroundColorOpacityPressed,
      )
    }

    if (!pressed && backgroundColor) {
      return backgroundStyle(backgroundColor as Color, backgroundColorOpacity)
    }
  }, [
    pressed,
    backgroundColor,
    backgroundColorOpacity,
    backgroundColorOpacityPressed,
    backgroundColorPressed,
    backgroundStyle,
  ])

  if (title) {
    return (
      <Box visible={visible} marginHorizontal="2">
        <Pressable
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={styles.pressable}
          disabled={disabled}
        >
          <Box
            style={backgroundColorStyle}
            height={size}
            alignItems="center"
            justifyContent="center"
            flexDirection={reverse ? 'row-reverse' : 'row'}
            paddingHorizontal="4"
            borderRadius="full"
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
              variant="textLgMedium"
              color={iconColor}
              paddingHorizontal="xs"
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
          </Box>
        </Pressable>
      </Box>
    )
  }

  return (
    <ButtonPressAnimation
      height={size}
      width={size}
      borderRadius="full"
      visible={visible}
      onPress={onPress}
      pressableStyles={styles.pressable}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      {...boxProps}
    >
      <FabButtonCircle
        pressed={pressed}
        size={size}
        icon={icon}
        iconColor={iconColor}
        iconColorPressed={iconColorPressed}
        props={containerProps}
        style={backgroundColorStyle}
      />
    </ButtonPressAnimation>
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
    case 'arrowLeft':
      return (
        <ArrowDown
          color={getIconColor()}
          style={{ transform: [{ rotate: '90deg' }] }}
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
    case 'close':
      return <Close color={getIconColor()} />
    case 'filter':
      return <Filter color={getIconColor()} />
    case 'swaps':
      return <Swaps color={getIconColor()} />
    case 'airdrop':
      return <Airdrop width={17} height={17} color={getIconColor()} />
    case 'mapUserLocation':
      return <MapUserLocation color={getIconColor()} />
    case 'search':
      return <Search color={getIconColor()} />
    default:
    case 'dots':
      return <Dots color={getIconColor()} />
    case 'info':
      return <Info color={getIconColor()} />
    case 'questionMark':
      return <QuestionMark color={getIconColor()} />
    case 'browseVoters':
      return <BrowseVoters color={getIconColor()} />
    case 'expand':
      return <Expand color={getIconColor()} />
    case 'settings':
      return <Settings color={getIconColor()} />
  }
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    alignItems: 'center',
  },
})

export default memo(ButtonPressable)
