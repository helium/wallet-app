import React from 'react'
import CheckMarkFill from '@assets/images/checkmarkFill.svg'
import Box from './Box'
import Text from './Text'
import { useColors } from '../theme/themeHooks'
import { TouchableOpacityBoxProps } from './TouchableOpacityBox'
import TouchableContainer from './TouchableContainer'

export const LIST_ITEM_HEIGHT = 70
export type ListItemProps = {
  Icon?: React.ReactNode
  SecondaryIcon?: React.ReactNode
  title: string
  subtitle?: string
  onPress?: () => void
  selected?: boolean
  disabled?: boolean
  hasDivider?: boolean
  hasPressedState?: boolean
} & TouchableOpacityBoxProps

const ListItem = ({
  Icon,
  SecondaryIcon,
  title,
  subtitle,
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
      height={LIST_ITEM_HEIGHT}
      borderBottomColor="black900"
      borderBottomWidth={hasDivider ? 1 : 0}
      onPress={handlePress}
      hasPressedState={hasPressedState}
      {...rest}
    >
      {Icon && Icon}
      <Box flexGrow={1} justifyContent="center" marginStart={Icon ? 'm' : 'l'}>
        <Text variant="subtitle2">{title}</Text>
        {subtitle && <Text>{subtitle}</Text>}
      </Box>
      <Box marginEnd="l">
        {selected ? (
          <CheckMarkFill color={colors.white} opacity={disabled ? 0.6 : 1.0} />
        ) : null}
        {SecondaryIcon && SecondaryIcon}
      </Box>
    </TouchableContainer>
  )
}

export default ListItem
