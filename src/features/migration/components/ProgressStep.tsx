import CheckIco from '@assets/images/checkIco.svg'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { WORLD_TRACKING } from '../migrationTheme'

const ProgressStep: FC<{ label: string }> = ({ label }) => {
  const { t } = useTranslation()
  const colors = useColors()
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="l"
    >
      <CircleLoader loaderSize={40} color="worldPurple" />
      <Text
        variant="h3"
        color="worldInk"
        letterSpacing={WORLD_TRACKING.hero}
        marginTop="l"
      >
        {t('migrateToWorld.migrating.title')}
      </Text>

      <Box
        flexDirection="row"
        alignItems="center"
        backgroundColor="worldSuccessBg"
        borderRadius="round"
        paddingHorizontal="m"
        paddingVertical="xs"
        marginTop="l"
      >
        <CheckIco color={colors.worldSuccess} width={11} height={8} />
        <Text
          variant="body3Bold"
          color="worldSuccess"
          marginLeft="xs"
          lineHeight={16}
        >
          {t('migrateToWorld.migrating.walletReady')}
        </Text>
      </Box>

      {/* Fixed-height slot so the batch pill appearing/disappearing between
          batches doesn't shift the stack mid-migration. */}
      <Box height={34} marginTop="s" justifyContent="center">
        {label ? (
          <Box
            backgroundColor="worldSurfaceAlt"
            borderWidth={1}
            borderColor="worldBorder"
            borderRadius="round"
            paddingHorizontal="m"
            paddingVertical="xs"
          >
            <Text variant="body3Medium" color="worldSecondaryInk">
              {label}
            </Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

export default ProgressStep
