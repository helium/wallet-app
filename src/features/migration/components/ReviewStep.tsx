import Box from '@components/Box'
import Text from '@components/Text'
import { shortenAddress } from '@utils/formatting'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import StepBackHeader from './StepBackHeader'
import WorldButton from './WorldButton'

const Card: FC<{ children: ReactNode }> = ({ children }) => (
  <Box
    backgroundColor="grey100"
    borderRadius="xl"
    borderWidth={1}
    borderColor="worldBorder"
    paddingHorizontal="l"
    paddingVertical="m"
    marginBottom="m"
  >
    {children}
  </Box>
)

const Line: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center"
    paddingVertical="s"
  >
    <Text variant="body3" color="worldSecondaryInk">
      {label}
    </Text>
    <Text variant="body2Medium" color="worldInk">
      {value}
    </Text>
  </Box>
)

const Divider = () => <Box height={1} backgroundColor="worldBorder" />

// A hairline divider with a centered down-arrow badge, showing assets flowing
// from the source wallet into the destination.
const ArrowDivider = () => (
  <Box paddingVertical="xs" alignItems="center" justifyContent="center">
    <Box height={1} backgroundColor="worldBorder" width="100%" />
    <Box
      position="absolute"
      width={26}
      height={26}
      borderRadius="round"
      backgroundColor="worldAccentBg"
      alignItems="center"
      justifyContent="center"
    >
      <Text variant="body2Medium" color="worldPurple" lineHeight={18}>
        ↓
      </Text>
    </Box>
  </Box>
)

const ReviewStep: FC<{
  sourceWallet: string
  destinationWallet: string
  hotspotCount: number
  tokenLines: string[]
  error?: string
  onBack: () => void
  onConfirm: () => void
}> = ({
  sourceWallet,
  destinationWallet,
  hotspotCount,
  tokenLines,
  error,
  onBack,
  onConfirm,
}) => {
  const { t } = useTranslation()
  return (
    <Box flex={1}>
      <StepBackHeader onBack={onBack} />
      <Box flex={1} paddingHorizontal="l">
        <Text variant="h4" color="worldInk" marginBottom="l">
          {t('migrateToWorld.confirm.title')}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card>
            <Line
              label={t('migrateToWorld.confirm.source')}
              value={shortenAddress(sourceWallet, 6)}
            />
            <ArrowDivider />
            <Line
              label={t('migrateToWorld.confirm.destination')}
              value={shortenAddress(destinationWallet, 6)}
            />
          </Card>

          <Card>
            <Line
              label={t('migrateToWorld.selectAssets.hotspots')}
              value={String(hotspotCount)}
            />
            {tokenLines.map((line) => (
              <Box key={line}>
                <Divider />
                <Box
                  flexDirection="row"
                  justifyContent="flex-end"
                  paddingVertical="s"
                >
                  <Text variant="body2Medium" color="worldInk">
                    {line}
                  </Text>
                </Box>
              </Box>
            ))}
          </Card>

          <Card>
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingVertical="xs"
            >
              <Text variant="body3" color="worldSecondaryInk">
                {t('migrateToWorld.confirm.fees')}
              </Text>
              <Box
                backgroundColor="worldSuccessBg"
                borderRadius="round"
                paddingHorizontal="m"
                paddingVertical="xs"
              >
                <Text variant="body3" color="worldSuccess" fontWeight="700">
                  {t('migrateToWorld.confirm.free')}
                </Text>
              </Box>
            </Box>
          </Card>
        </ScrollView>

        {error ? (
          <Text variant="body3" color="error" textAlign="center" marginTop="m">
            {error}
          </Text>
        ) : null}
        <WorldButton
          title={t('migrateToWorld.confirm.button')}
          onPress={onConfirm}
          marginTop="m"
          marginBottom="l"
        />
      </Box>
    </Box>
  )
}

export default ReviewStep
