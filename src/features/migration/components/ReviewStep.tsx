import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { shortenAddress } from '@utils/formatting'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

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
      <TouchableOpacityBox
        onPress={onBack}
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <Text variant="body2" color="secondaryText">
          ← {t('generic.back')}
        </Text>
      </TouchableOpacityBox>
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
          <Text variant="body2Medium" style={{ color: '#16a34a' }}>
            {t('migrateToWorld.confirm.free')}
          </Text>
        </Box>
        <Box flex={1} />
        <ButtonPressable
          width="100%"
          height={60}
          borderRadius="round"
          backgroundColor="worldPurple"
          backgroundColorOpacityPressed={0.7}
          titleColor="white"
          title={t('migrateToWorld.confirm.button')}
          onPress={onConfirm}
          marginBottom="l"
        />
      </Box>
    </Box>
  )
}

export default ReviewStep
