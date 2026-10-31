import { Text } from '@ui/Text'
import { TriangleAlert } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const AlertIcon = withUniwind(TriangleAlert)

export const WarningBox = ({
  header,
  body,
}: {
  header: string
  body: string
}) => {
  return (
    <View className="mb-2 flex-col items-stretch rounded-[12px] bg-card p-2">
      <View className="mb-1 flex-row items-center">
        <View className="mr-1">
          <AlertIcon size={16} colorClassName="accent-destructive" />
        </View>
        <Text size="xs" className="font-bold">
          {header}
        </Text>
      </View>
      <Text size="xs" className="text-muted-foreground">
        {body}
      </Text>
    </View>
  )
}
