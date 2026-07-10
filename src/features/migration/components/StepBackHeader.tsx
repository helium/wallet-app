import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

// The "← Back" touchable header shared by the migration steps.
const StepBackHeader: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation()
  return (
    <TouchableOpacityBox
      onPress={onBack}
      paddingHorizontal="l"
      paddingVertical="m"
    >
      <Text variant="body2" color="secondaryText">
        {t('migrateToWorld.back')}
      </Text>
    </TouchableOpacityBox>
  )
}

export default StepBackHeader
