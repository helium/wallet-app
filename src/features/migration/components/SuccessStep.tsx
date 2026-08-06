import Checkmark from '@assets/images/checkmark.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import { shortenAddress } from '@utils/formatting'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import OutcomeStep from './OutcomeStep'

const SuccessStep: FC<{
  destinationWallet: string
  onGoToWorld: () => void
  onDone: () => void
}> = ({ destinationWallet, onGoToWorld, onDone }) => {
  const { t } = useTranslation()
  const colors = useColors()
  return (
    <OutcomeStep
      title={t('migrateToWorld.success.title')}
      body={t('migrateToWorld.success.body')}
      primaryTitle={t('migrateToWorld.success.goToWorld')}
      onPrimary={onGoToWorld}
      onDismiss={onDone}
      dismissTitle={t('migrateToWorld.nothingToMigrate.done')}
      icon={<Checkmark color={colors.worldSuccess} width={56} height={56} />}
    >
      <Box
        alignSelf="center"
        backgroundColor="worldSurfaceAlt"
        borderWidth={1}
        borderColor="worldBorder"
        borderRadius="round"
        paddingHorizontal="m"
        paddingVertical="s"
        marginTop="m"
      >
        <Text variant="body3Medium" color="worldInk">
          {t('migrateToWorld.success.wallet', {
            address: shortenAddress(destinationWallet, 6),
          })}
        </Text>
      </Box>
    </OutcomeStep>
  )
}

export default SuccessStep
