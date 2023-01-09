/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import { BoxProps } from '@shopify/restyle'
import { Insets } from 'react-native'
import BackArrow from '@assets/images/backArrow.svg'
import { Color, Spacing, Theme } from '../theme/theme'
import TouchableOpacityBox from './TouchableOpacityBox'
import { useColors } from '../theme/themeHooks'

type Props = BoxProps<Theme> & {
  color?: Color
  onPress?: () => void
  paddingHorizontal?: Spacing
  hitSlop?: Insets
}

const BackButton = ({
  color = 'primaryText',
  onPress,
  paddingHorizontal = 'lx',
  hitSlop,
  ...props
}: Props) => {
  const colors = useColors()

  return (
    <TouchableOpacityBox
      onPress={onPress}
      alignSelf="flex-start"
      paddingVertical="s"
      paddingHorizontal={paddingHorizontal}
      alignItems="center"
      flexDirection="row"
      hitSlop={hitSlop}
      {...props}
    >
      <BackArrow color={colors[color]} />
    </TouchableOpacityBox>
  )
}

export default BackButton
