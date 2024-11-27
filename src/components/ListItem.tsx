import React from 'react'
import CheckMarkFill from '@assets/svgs/checkmarkFill.svg'
import { useColors } from '@config/theme/themeHooks'
import { Color, Theme } from '@config/theme/theme'
import { Insets } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import Box from './Box'
import Text from './Text'
import TouchableContainer from './TouchableContainer'

export const LIST_ITEM_HEIGHT = 70
export type ListItemProps = {
  Icon?: React.ReactNode
  SecondaryIcon?: React.ReactNode
  title: string
  subtitle?: string
  subtitleColor?: Color
  onPress?: () => void
  selected?: boolean
  disabled?: boolean
  hasDivider?: boolean
  hasPressedState?: boolean
  hitSlop?: Insets
} & BoxProps<Theme>

const ListItem = ({
  Icon,
  SecondaryIcon,
  title,
  subtitle,
  subtitleColor,
  onPress,
  selected,
  disabled,
  hasDivider = true,
  hasPressedState = true,
  ...rest
}: ListItemProps) => {
  const colors = useColors()

  const handlePress = () => {
    if (onPress) {
      onPress()
    }
  }

  return (
    <TouchableContainer
      alignItems="center"
      flex={1}
      flexDirection="row"
      paddingVertical="4"
      borderBottomColor="primaryBackground"
      borderBottomWidth={hasDivider ? 1 : 0}
      onPress={handlePress}
      hasPressedState={hasPressedState}
      {...rest}
    >
      {Icon && Icon}
      <Box flex={1} justifyContent="center" marginHorizontal="4">
        <Text variant="textMdMedium" color="primaryText">
          {title}
        </Text>
        {subtitle && (
          <Text variant="textSmMedium" marginTop="xs" color={subtitleColor}>
            {subtitle}
          </Text>
        )}
      </Box>
      <Box marginEnd="6">
        {selected ? (
          <CheckMarkFill
            color={colors.primaryText}
            opacity={disabled ? 0.6 : 1.0}
            height={20}
            width={20}
          />
        ) : null}
        {SecondaryIcon && SecondaryIcon}
      </Box>
    </TouchableContainer>
  )
}

export default ListItem
