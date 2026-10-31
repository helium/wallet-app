import { useNavigation } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { ChevronLeft } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'

const SafeArea = withUniwind(SafeAreaView)
const BackIcon = withUniwind(ChevronLeft)

// The back header and padded body shared by the hotspot onboarding screens.
const OnboardingScreen = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => {
  const navigation = useNavigation()
  const { t } = useTranslation()
  return (
    <SafeArea className="flex-1 bg-background">
      <View className="flex-row items-center px-7">
        <PressableScale
          onPress={() => navigation.goBack()}
          hitSlop={24}
          feedback="opacity"
          accessibilityLabel={t('generic.back')}
        >
          <BackIcon size={24} colorClassName="accent-foreground" />
        </PressableScale>
        <Text
          size="xl"
          numberOfLines={1}
          className="flex-1 text-center font-medium"
        >
          {title}
        </Text>
        <View className="size-6" />
      </View>
      <View className="flex-1 p-7">{children}</View>
    </SafeArea>
  )
}

export default OnboardingScreen
