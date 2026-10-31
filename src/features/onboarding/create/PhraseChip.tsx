import { PressableScale, type PressableScaleProps } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { upperCase } from 'lodash'
import { Check, X } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const CheckIcon = withUniwind(Check)
const FailIcon = withUniwind(X)

type Props = Omit<PressableScaleProps, 'children'> & {
  title: string
  selected?: boolean
  fail: boolean
  success: boolean
}

const chipBackground = (fail: boolean, success: boolean) => {
  if (fail) return 'bg-destructive'
  if (success) return 'bg-purple-500'
  return 'bg-navy-glass'
}

const PhraseChip = ({
  title,
  selected,
  fail,
  success,
  disabled,
  className,
  ...props
}: Props) => (
  <PressableScale
    feedback="opacity"
    disabled={selected || disabled}
    className={twMerge(
      'max-w-[30%] justify-center rounded-xl py-2',
      chipBackground(fail, success),
      className,
    )}
    {...props}
  >
    <View className="absolute inset-0 items-center justify-center">
      {success && <CheckIcon colorClassName="accent-navy-foreground" />}
      {fail && <FailIcon colorClassName="accent-navy-foreground" />}
    </View>
    <Text
      size="lg"
      numberOfLines={1}
      adjustsFontSizeToFit
      className={twMerge(
        'px-4',
        selected ? 'text-navy-foreground' : 'text-navy-foreground/50',
        (fail || success) && 'opacity-0',
      )}
    >
      {upperCase(title)}
    </Text>
  </PressableScale>
)

export default PhraseChip
