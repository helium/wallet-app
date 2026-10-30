import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { ChevronLeft } from 'lucide-react-native'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'

const BackIcon = withUniwind(ChevronLeft)

// The back-chevron header shared by the migration steps. Carries the top
// safe-area inset itself so the flow screen can stay full-bleed (letting the
// asset sheets' backdrop reach the top of the screen). The touchable hugs the
// label (with a generous hit slop) instead of spanning the screen, so taps
// near the top edge elsewhere don't accidentally navigate back.
const StepBackHeader: FC<{ onBack: () => void }> = ({ onBack }) => {
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
        <Text className="text-muted-foreground">
          {t('migrateToWorld.back')}
        </Text>
      </PressableScale>
    </View>
  )
}

export default StepBackHeader
