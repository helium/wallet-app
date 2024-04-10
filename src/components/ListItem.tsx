import React from 'react'
import CheckMarkFill from '@assets/images/checkmarkFill.svg'
import { useColors } from '@theme/themeHooks'
import { Color } from '@theme/theme'
import { Insets } from 'react-native'
import Box from './Box'
import Text from './Text'
import { TouchableOpacityBoxProps } from './TouchableOpacityBox'
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
} & TouchableOpacityBoxProps

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
      paddingVertical="m"
      borderBottomColor="black900"
      borderBottomWidth={hasDivider ? 1 : 0}
      onPress={handlePress}
      hasPressedState={hasPressedState}
      {...rest}
    >
      {Icon && Icon}
      <Box flex={1} justifyContent="center" marginHorizontal="m">
        <Text variant="subtitle3">{title}</Text>
        {subtitle && (
          <Text marginTop="xs" color={subtitleColor}>
            {subtitle}
          </Text>
        )}
      </Box>
      <Box marginEnd="l">
        {selected ? (
          <CheckMarkFill
            color={colors.white}
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
