import React from 'react'
import { Insets, View } from 'react-native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'

export type ActivityListItemProps = {
  url: string
  hasDivider?: boolean
  hitSlop?: Insets
  onPress?: () => void
  className?: string
}

const BrowserListItem = ({
  url,
  hasDivider,
  className,
  ...rest
}: ActivityListItemProps) => {
  return (
    <PressableScale
      feedback="opacity"
      className={twMerge(
        'flex-row bg-secondary p-4',
        hasDivider && 'border-b border-border',
        className,
      )}
      {...rest}
    >
      <View className="ms-2 grow basis-0 justify-center">
        <Text className="font-medium">{url}</Text>
      </View>
    </PressableScale>
  )
}

export default BrowserListItem
