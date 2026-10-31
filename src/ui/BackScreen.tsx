import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { View } from 'react-native'
import { type Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { BackButton } from './BackButton'
import { Text } from './Text'
import { twMerge } from './twMerge'

const SafeArea = withUniwind(SafeAreaView)

export type BackScreenProps = {
  children?: React.ReactNode
  edges?: Edge[]
  title?: string
  // The content area; it defaults to `flex-1 p-7`.
  className?: string
  headerClassName?: string
}

// A screen with a back header and an optional centred title.
export const BackScreen = ({
  children,
  edges,
  title,
  className,
  headerClassName,
}: BackScreenProps) => {
  const navigation = useNavigation()

  return (
    <SafeArea edges={edges} className="flex-1">
      <View className={twMerge('flex-row px-7', headerClassName)}>
        <View className="absolute inset-0 items-center justify-center">
          <Text size="xl" className="font-medium">
            {title}
          </Text>
        </View>
        <BackButton className="-mx-3 px-0" onPress={navigation.goBack} />
      </View>
      <View className={twMerge('flex-1 p-7', className)}>{children}</View>
    </SafeArea>
  )
}
