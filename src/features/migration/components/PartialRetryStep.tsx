import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

const PartialRetryStep: FC<{
  movedCount: number
  failedCount: number
  onRetry: () => void
  onDismiss: () => void
}> = ({ movedCount, failedCount, onRetry, onDismiss }) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text variant="h4" color="primaryText" textAlign="center">
        {t('migrateToWorld.partial.title')}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        textAlign="center"
        marginTop="m"
      >
        {t('migrateToWorld.partial.body', {
          moved: movedCount,
          failed: failedCount,
        })}
      </Text>
      <ButtonPressable
        width="100%"
        height={60}
        borderRadius="round"
        backgroundColor="worldPurple"
        backgroundColorOpacityPressed={0.7}
        titleColor="white"
        title={t('migrateToWorld.partial.retry')}
        onPress={onRetry}
        marginTop="xl"
        marginBottom="m"
      />
      <ButtonPressable
        width="100%"
        height={48}
        borderRadius="round"
        backgroundColor="transparent"
        titleColor="secondaryText"
        title={t('migrateToWorldModal.dismiss')}
        onPress={onDismiss}
      />
    </Box>
  )
}

export default PartialRetryStep
