import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import React, { FC } from 'react'
import { View } from 'react-native'

// Centered spinner + caption used by the migration flow's loading screens.
// One spinner size and one caption style for every full-screen wait, so the
// same moment doesn't render at different scales across steps.
const WorldLoader: FC<{ caption: string }> = ({ caption }) => (
  <View className="flex-1 items-center justify-center">
    <Spinner size="large" />
    <Text className="mt-4 text-muted-foreground">{caption}</Text>
  </View>
)

export default WorldLoader
