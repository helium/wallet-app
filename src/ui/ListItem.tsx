import { CircleCheck } from 'lucide-react-native'
import React from 'react'
import { type Insets, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Text } from './Text'
import { TouchableContainer } from './TouchableContainer'
import { twMerge } from './twMerge'

const CircleCheckIcon = withUniwind(CircleCheck)

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
  hitSlop?: Insets
  testID?: string
  className?: string
}

// A pressable row: an optional leading icon, a title and subtitle, and a
// check when selected.
export const ListItem = ({
  Icon,
  SecondaryIcon,
  title,
  subtitle,
  onPress,
  selected,
  disabled,
  hasDivider = true,
  hasPressedState = true,
  hitSlop,
  testID,
  className,
}: ListItemProps) => (
  <TouchableContainer
    testID={testID}
    hitSlop={hitSlop}
    onPress={() => onPress?.()}
    hasPressedState={hasPressedState}
    disabled={disabled}
    className={twMerge(
      'flex-1 flex-row items-center py-4',
      hasDivider && 'border-b border-border',
      className,
    )}
  >
    {Icon}
    <View className="mx-4 flex-1 justify-center">
      <Text size="base" className="font-medium">
        {title}
      </Text>
      {subtitle ? <Text className="mt-1">{subtitle}</Text> : null}
    </View>
    <View className="mr-6">
      {selected ? (
        <CircleCheckIcon
          size={20}
          colorClassName="accent-foreground"
          className={disabled ? 'opacity-60' : undefined}
        />
      ) : null}
      {SecondaryIcon}
    </View>
  </TouchableContainer>
)
