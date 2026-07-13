import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

const ProgressStep: FC<{ label: string }> = ({ label }) => {
  const { t } = useTranslation()
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="l"
    >
      <CircleLoader loaderSize={40} color="worldPurple" />
      <Text variant="h3" color="worldInk" letterSpacing={-0.8} marginTop="l">
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
        <Text variant="body3" color="worldSuccess" fontWeight="700">
          {t('migrateToWorld.migrating.walletReady')}
        </Text>
      </Box>

      {label ? (
        <Box
          backgroundColor="grey100"
          borderWidth={1}
          borderColor="worldBorder"
          borderRadius="round"
          paddingHorizontal="m"
          paddingVertical="xs"
          marginTop="s"
        >
          <Text variant="body3" color="worldSecondaryInk" fontWeight="500">
            {label}
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}

export default ProgressStep
