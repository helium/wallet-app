import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import { shortenAddress } from '@utils/formatting'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

const SuccessStep: FC<{
  destinationWallet: string
  onGoToWorld: () => void
  onDone: () => void
}> = ({ destinationWallet, onGoToWorld, onDone }) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text
        variant="h4"
        color="primaryText"
        textAlign="center"
        marginBottom="m"
      >
        {t('migrateToWorld.success.title')}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        textAlign="center"
        marginBottom="s"
      >
        {t('migrateToWorld.success.body')}
      </Text>
      <Text
        variant="body3"
        color="secondaryText"
        textAlign="center"
        marginBottom="xl"
      >
        {t('migrateToWorld.success.wallet', {
          address: shortenAddress(destinationWallet, 6),
        })}
      </Text>
      <ButtonPressable
        width="100%"
        height={60}
        borderRadius="round"
        backgroundColor="worldPurple"
        backgroundColorOpacityPressed={0.7}
        titleColor="white"
        title={t('migrateToWorld.success.goToWorld')}
        onPress={onGoToWorld}
        marginBottom="m"
      />
      <ButtonPressable
        width="100%"
        height={48}
        borderRadius="round"
        backgroundColor="transparent"
        titleColor="secondaryText"
        title={t('migrateToWorldModal.dismiss')}
        onPress={onDone}
      />
    </Box>
  )
}

export default SuccessStep
