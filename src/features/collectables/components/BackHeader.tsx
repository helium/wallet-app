import { useNavigation } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ChevronLeft, X } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const BackIcon = withUniwind(ChevronLeft)
const CloseIcon = withUniwind(X)

type Props = {
  title?: string
  hideBack?: boolean
  onClose?: () => void
  className?: string
}

// The collectables screens' header: a back chevron, a centred title and an
// optional close button. It replaces the header row of the legacy
// BackScreen; the screen supplies its own safe area.
const BackHeader = ({ title, hideBack, onClose, className }: Props) => {
  const navigation = useNavigation()
  return (
    <View className={twMerge('h-12 flex-row items-center px-6', className)}>
      <View className="absolute inset-0 items-center justify-center">
        <Text size="xl" className="font-medium" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {!hideBack && (
        <PressableScale
          onPress={navigation.goBack}
          hitSlop={24}
          feedback="opacity"
          accessibilityLabel="Back"
        >
          <BackIcon size={24} colorClassName="accent-foreground" />
        </PressableScale>
      )}
      <View className="flex-1" />
      {onClose && (
        <PressableScale
          onPress={onClose}
          hitSlop={24}
          feedback="opacity"
          accessibilityLabel="Close"
        >
          <CloseIcon size={24} colorClassName="accent-foreground" />
        </PressableScale>
      )}
    </View>
  )
}

export default BackHeader
