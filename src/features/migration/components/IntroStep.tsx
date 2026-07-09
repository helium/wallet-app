import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

const IntroStep: FC<{ onContinue: () => void; onDismiss: () => void }> = ({
  onContinue,
  onDismiss,
}) => {
  const { t } = useTranslation()
  return (
    <Box
      flex={1}
      justifyContent="space-between"
      paddingHorizontal="l"
      paddingBottom="l"
    >
      <Box flex={1} justifyContent="center">
        <Text variant="h1" color="primaryText" textAlign="center">
          {t('migrateToWorld.intro.title')}
        </Text>
        <Text
          variant="body1"
          color="secondaryText"
          textAlign="center"
          marginTop="l"
        >
          {t('migrateToWorld.intro.body')}
        </Text>
      </Box>
      <Box>
        <ButtonPressable
          width="100%"
          height={60}
          borderRadius="round"
          backgroundColor="worldPurple"
          backgroundColorOpacityPressed={0.7}
          titleColor="white"
          title={t('migrateToWorld.intro.continue')}
          onPress={onContinue}
          marginBottom="m"
        />
        <ButtonPressable
          width="100%"
          height={48}
          borderRadius="round"
          backgroundColor="transparent"
          titleColor="secondaryText"
          title={t('migrateToWorld.intro.later')}
          onPress={onDismiss}
        />
      </Box>
    </Box>
  )
}

export default IntroStep
