import DownArrow from '@assets/images/downArrow.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import { shortenAddress } from '@utils/formatting'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { WORLD_TRACKING } from '../migrationTheme'
import StepBackHeader from './StepBackHeader'
import WorldButton from './WorldButton'

export type ReviewTokenLine = { mint: string; label: string; amount: string }

const contentStyle = { paddingBottom: 16 }

const Card: FC<{ children: ReactNode }> = ({ children }) => (
  <Box
    backgroundColor="worldSurfaceAlt"
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
// from the source wallet into the destination. The container is tall enough to
// hold the badge so it no longer overhangs the neighboring rows.
const ArrowDivider = () => {
  const colors = useColors()
  return (
    <Box height={30} alignItems="center" justifyContent="center">
      <Box height={1} backgroundColor="worldBorder" width="100%" />
      <Box
        position="absolute"
        width={28}
        height={28}
        borderRadius="round"
        backgroundColor="worldAccentBg"
        alignItems="center"
        justifyContent="center"
      >
        <DownArrow color={colors.worldPurple} width={11} height={13} />
      </Box>
    </Box>
  )
}

const ReviewStep: FC<{
  sourceWallet: string
  destinationWallet: string
  hotspotCount: number
  tokenLines: ReviewTokenLine[]
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
        <Text
          variant="h4"
          color="worldInk"
          letterSpacing={WORLD_TRACKING.title}
          marginBottom="l"
        >
          {t('migrateToWorld.confirm.title')}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyle}
        >
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
              <Box key={line.mint}>
                <Divider />
                <Line label={line.label} value={line.amount} />
              </Box>
            ))}
          </Card>

          <Card>
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingVertical="s"
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
                <Text variant="body3Bold" color="worldSuccess">
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
