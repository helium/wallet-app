import { ChevronLeft } from 'lucide-react-native'
import React from 'react'
import { type Insets, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { PressableScale } from './PressableScale'
import { twMerge } from './twMerge'

const ChevronLeftIcon = withUniwind(ChevronLeft)

export type BackButtonProps = {
  onPress?: () => void
  hitSlop?: Insets
  className?: string
}

// A back chevron in a 44pt press target.
export const BackButton = ({
  onPress,
  hitSlop,
  className,
}: BackButtonProps) => (
  <View className={twMerge('flex-row items-center self-start px-7', className)}>
    <PressableScale
      feedback="opacity"
      hitSlop={hitSlop}
      onPress={onPress}
      className="size-11 items-center justify-center"
    >
      <ChevronLeftIcon size={24} colorClassName="accent-foreground" />
    </PressableScale>
  </View>
)
