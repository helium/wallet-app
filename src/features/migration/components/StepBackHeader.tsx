import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useHitSlop } from '@theme/themeHooks'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const CHEVRON_STYLE = { transform: [{ rotate: '45deg' }] }

// The back-chevron header shared by the migration steps. Carries the top
// safe-area inset itself so the flow screen can stay full-bleed (letting the
// asset sheets' backdrop reach the top of the screen). The touchable hugs the
// label (with a generous hit slop) instead of spanning the screen, so taps
// near the top edge elsewhere don't accidentally navigate back.
const StepBackHeader: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  const hitSlop = useHitSlop('l')
  return (
    <TouchableOpacityBox
      onPress={onBack}
      hitSlop={hitSlop}
      alignSelf="flex-start"
      flexDirection="row"
      alignItems="center"
      paddingHorizontal="l"
      paddingBottom="m"
      style={{ paddingTop: top + 12 }}
    >
      <Box
        width={9}
        height={9}
        borderLeftWidth={1.5}
        borderBottomWidth={1.5}
        borderColor="worldSecondaryInk"
        marginRight="xs"
        style={CHEVRON_STYLE}
      />
      <Text variant="body2" color="worldSecondaryInk">
        {t('migrateToWorld.back')}
      </Text>
    </TouchableOpacityBox>
  )
}

export default StepBackHeader
