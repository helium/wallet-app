import React from 'react'
import CheckMarkFill from '@assets/images/checkmarkFill.svg'
import Box from './Box'
import Text from './Text'
import { useColors } from '../theme/themeHooks'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from './TouchableOpacityBox'

export type ListItemProps = {
  Icon?: React.ReactNode
  SecondaryIcon?: React.ReactNode
  title: string
  subtitle?: string
  onPress?: () => void
  selected?: boolean
  disabled?: boolean
  hasDivider?: boolean
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
  ...rest
}: ListItemProps) => {
  const colors = useColors()

  const handlePress = () => {
    if (onPress) {
      onPress()
    }
  }

  return (
    <TouchableOpacityBox
      alignItems="center"
      flex={1}
      flexDirection="row"
      height={70}
      borderBottomColor="black900"
      borderBottomWidth={hasDivider ? 1 : 0}
      onPress={handlePress}
      {...rest}
    >
      {Icon && Icon}
      <Box flexGrow={1} justifyContent="center">
        <Text variant="subtitle2" marginStart="l">
          {title}
        </Text>
        {subtitle && <Text>{subtitle}</Text>}
      </Box>
      <Box marginEnd="l">
        {selected ? (
          <CheckMarkFill color={colors.white} opacity={disabled ? 0.6 : 1.0} />
        ) : null}
        {SecondaryIcon && SecondaryIcon}
      </Box>
    </TouchableOpacityBox>
  )
}

export default ListItem
