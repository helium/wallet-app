import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// The "← Back" touchable header shared by the migration steps. Carries the top
// safe-area inset itself so the flow screen can stay full-bleed (letting the
// asset sheets' backdrop reach the top of the screen).
const StepBackHeader: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  return (
    <TouchableOpacityBox
      onPress={onBack}
      paddingHorizontal="l"
      paddingBottom="m"
      style={{ paddingTop: top + 12 }}
    >
      <Text variant="body2" color="secondaryText">
        {t('migrateToWorld.back')}
      </Text>
    </TouchableOpacityBox>
  )
}

export default StepBackHeader
