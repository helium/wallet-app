import { X } from 'lucide-react-native'
import React from 'react'
import { type GestureResponderEvent, type Insets, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { PressableScale } from './PressableScale'

const XIcon = withUniwind(X)

export type CloseButtonProps = {
  onPress?: (event: GestureResponderEvent) => void
  hitSlop?: Insets
  testID?: string
  className?: string
}

// A close glyph in a 44pt press target.
export const CloseButton = ({
  onPress,
  hitSlop,
  testID,
  className,
}: CloseButtonProps) => (
  <View className={className}>
    <PressableScale
      feedback="opacity"
      testID={testID}
      hitSlop={hitSlop}
      onPress={onPress}
      className="size-11 items-center justify-center"
    >
      <XIcon size={24} colorClassName="accent-foreground" />
    </PressableScale>
  </View>
)
