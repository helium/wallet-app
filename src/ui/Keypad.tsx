import useHaptic from '@hooks/useHaptic'
import { decimalSeparator } from '@utils/i18n'
import { Delete } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Text } from './Text'
import { twMerge } from './twMerge'

const DeleteIcon = withUniwind(Delete)

export type KeypadCustomInput = 'clear' | 'decimal' | 'cancel'
export type KeypadInput = number | 'backspace' | KeypadCustomInput

const KeypadButton = ({
  value,
  onPress,
}: {
  value?: KeypadInput
  onPress: (value?: KeypadInput) => void
}) => {
  const { t } = useTranslation()

  const label = (pressed: boolean) => {
    const textClassName = pressed ? 'text-foreground' : 'text-muted-foreground'
    if (typeof value === 'number' || value === 'decimal') {
      return (
        <Text
          size="4xl"
          className={textClassName}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {value === 'decimal' ? decimalSeparator : value}
        </Text>
      )
    }
    if (value === 'backspace') {
      return (
        <DeleteIcon
          colorClassName={
            pressed ? 'accent-foreground' : 'accent-muted-foreground'
          }
        />
      )
    }
    if (value === 'clear' || value === 'cancel') {
      return (
        <Text
          size="base"
          className={twMerge('text-center', textClassName)}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {t(value === 'clear' ? 'generic.clear' : 'generic.cancel')}
        </Text>
      )
    }
    return null
  }

  return (
    <View className="basis-1/3 items-center justify-center">
      <Pressable
        testID={`Keypad.${value}`}
        onPressIn={() => onPress(value)}
        disabled={!value && value !== 0}
        hitSlop={16}
      >
        {({ pressed }) => (
          <View
            className={twMerge(
              'aspect-square h-full max-h-20 max-w-20 items-center justify-center overflow-hidden rounded-full',
              pressed && 'bg-secondary',
            )}
          >
            {label(pressed)}
          </View>
        )}
      </Pressable>
    </View>
  )
}

export type KeypadProps = {
  onPress?: (value?: KeypadInput) => void
  customButtonType?: KeypadCustomInput
  className?: string
}

// A PIN and amount keypad: 1–9, then the custom key, 0 and backspace. Keys
// fire on press-in with a haptic.
export const Keypad = ({
  onPress,
  customButtonType,
  className,
}: KeypadProps) => {
  const { triggerImpact } = useHaptic()

  const handlePress = (value?: KeypadInput) => {
    onPress?.(value)
    triggerImpact()
  }

  const rows: (KeypadInput | undefined)[][] = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [customButtonType, 0, 'backspace'],
  ]

  return (
    <View className={twMerge('flex-1', className)}>
      {rows.map((row) => (
        <View key={row.join()} className="flex-1 flex-row">
          {row.map((value, index) => (
            <KeypadButton key={index} value={value} onPress={handlePress} />
          ))}
        </View>
      ))}
    </View>
  )
}
