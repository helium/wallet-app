import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { ChevronLeft } from 'lucide-react-native'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'

const BackIcon = withUniwind(ChevronLeft)

// The back-chevron header of the settings screens, with an optional title
// below it. Carries the top safe-area inset itself.
const SettingsBackHeader: FC<{ onBack: () => void; title?: string }> = ({
  onBack,
  title,
}) => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  return (
    <View className="items-start px-6 pb-4" style={{ paddingTop: top + 12 }}>
      <PressableScale
        onPress={onBack}
        hitSlop={24}
        feedback="opacity"
        className="flex-row items-center gap-1"
      >
        <BackIcon size={16} colorClassName="accent-muted-foreground" />
        <Text className="text-muted-foreground">{t('generic.back')}</Text>
      </PressableScale>
      {!!title && (
        <Text size="xl" className="mt-4 self-center font-medium">
          {title}
        </Text>
      )}
    </View>
  )
}

export default SettingsBackHeader
