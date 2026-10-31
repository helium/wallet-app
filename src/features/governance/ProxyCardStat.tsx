import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import React from 'react'
import { View } from 'react-native'

export const ProxyCardStat: React.FC<{
  title: string
  value: string
  className?: string
}> = ({ title, value, className }) => {
  return (
    <View className={twMerge('flex-col', className)}>
      <Text size="xs" className="text-muted-foreground">
        {title}
      </Text>
      <Text size="base">{value}</Text>
    </View>
  )
}
