import Box from '@components/Box'
import Text from '@components/Text'
import { shortenAddress } from '@utils/formatting'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { WORLD } from '../migrationTheme'
import StepBackHeader from './StepBackHeader'
import WorldButton from './WorldButton'

const Row: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box flexDirection="row" justifyContent="space-between" marginBottom="m">
    <Text variant="body3" color="secondaryText">
      {label}
    </Text>
    <Text variant="body2Medium" color="primaryText">
      {value}
    </Text>
  </Box>
)

const ReviewStep: FC<{
  sourceWallet: string
  destinationWallet: string
  hotspotCount: number
  tokenLines: string[]
  onBack: () => void
  onConfirm: () => void
}> = ({
  sourceWallet,
  destinationWallet,
  hotspotCount,
  tokenLines,
  onBack,
  onConfirm,
}) => {
  const { t } = useTranslation()
  return (
    <Box flex={1}>
      <StepBackHeader onBack={onBack} />
      <Box flex={1} paddingHorizontal="l">
        <Text variant="h4" color="primaryText" marginBottom="l">
          {t('migrateToWorld.confirm.title')}
        </Text>
        <Row
          label={t('migrateToWorld.confirm.source')}
          value={shortenAddress(sourceWallet, 6)}
        />
        <Row
          label={t('migrateToWorld.confirm.destination')}
          value={shortenAddress(destinationWallet, 6)}
        />
        <Row
          label={t('migrateToWorld.selectAssets.hotspots')}
          value={String(hotspotCount)}
        />
        {tokenLines.map((line) => (
          <Text
            key={line}
            variant="body2Medium"
            color="primaryText"
            marginBottom="xs"
          >
            {line}
          </Text>
        ))}
        <Box marginTop="l" flexDirection="row" justifyContent="space-between">
          <Text variant="body3" color="secondaryText">
            {t('migrateToWorld.confirm.fees')}
          </Text>
          <Text variant="body2Medium" style={{ color: WORLD.success }}>
            {t('migrateToWorld.confirm.free')}
          </Text>
        </Box>
        <Box flex={1} />
        <WorldButton
          title={t('migrateToWorld.confirm.button')}
          onPress={onConfirm}
          marginBottom="l"
        />
      </Box>
    </Box>
  )
}

export default ReviewStep
