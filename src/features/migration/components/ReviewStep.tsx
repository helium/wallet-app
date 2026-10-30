import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { shortenAddress } from '@utils/formatting'
import { ChevronDown } from 'lucide-react-native'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { useTokenDisplay } from '../hooks/useTokenDisplay'
import StepBackHeader from './StepBackHeader'

export type ReviewTokenLine = { mint: string; label: string; amount: string }

const ArrowIcon = withUniwind(ChevronDown)

const Card: FC<{ children: ReactNode }> = ({ children }) => (
  <View className="mb-4 rounded-[20px] border border-border bg-secondary px-6 py-4">
    {children}
  </View>
)

const Line: FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className="flex-row items-center justify-between py-2">
    <Text size="xs" className="text-muted-foreground">
      {label}
    </Text>
    <Text className="font-medium">{value}</Text>
  </View>
)

const Divider = () => <View className="h-px bg-border" />

// Its own component so each line can resolve its token metadata; the label the
// classifier supplied is the fallback for a token with no metadata.
const TokenLine: FC<{ line: ReviewTokenLine }> = ({ line }) => {
  const { label } = useTokenDisplay(line.mint, line.label)
  return (
    <View>
      <Divider />
      <Line label={label} value={line.amount} />
    </View>
  )
}

// A hairline divider with a centered down-arrow badge, showing assets flowing
// from the source wallet into the destination. The container is tall enough to
// hold the badge so it no longer overhangs the neighboring rows.
const ArrowDivider = () => (
  <View className="h-[30px] items-center justify-center">
    <View className="h-px w-full bg-border" />
    <View className="absolute size-7 items-center justify-center rounded-full bg-purple-50">
      <ArrowIcon size={14} colorClassName="accent-purple-700" />
    </View>
  </View>
)

const ReviewStep: FC<{
  sourceWallet: string
  destinationWallet: string
  hotspotCount: number
  positionCount: number
  tokenLines: ReviewTokenLine[]
  error?: string
  onBack: () => void
  onConfirm: () => void
}> = ({
  sourceWallet,
  destinationWallet,
  hotspotCount,
  positionCount,
  tokenLines,
  error,
  onBack,
  onConfirm,
}) => {
  const { t } = useTranslation()
  return (
    <View className="flex-1">
      <StepBackHeader onBack={onBack} />
      <View className="flex-1 px-6">
        <Text size="xl" className="mb-6 tracking-tight">
          {t('migrateToWorld.confirm.title')}
        </Text>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-4"
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
              <TokenLine key={line.mint} line={line} />
            ))}
            {positionCount > 0 && (
              <View>
                <Divider />
                <Line
                  label={t('migrateToWorld.confirm.positions')}
                  value={String(positionCount)}
                />
                <Text size="xs" className="text-muted-foreground">
                  {t('migrateToWorld.confirm.positionsNote')}
                </Text>
              </View>
            )}
          </Card>

          <Card>
            <View className="flex-row items-center justify-between py-2">
              <Text size="xs" className="text-muted-foreground">
                {t('migrateToWorld.confirm.fees')}
              </Text>
              <View className="rounded-full bg-success-50 px-4 py-1">
                <Text size="xs" className="font-bold text-success-700">
                  {t('migrateToWorld.confirm.free')}
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        {error ? (
          <Text size="xs" className="mt-4 text-center text-destructive">
            {error}
          </Text>
        ) : null}
        <Button
          variant="cta"
          size="lg"
          className="mb-6 mt-4 w-full"
          testID="MigrateReview.Confirm"
          onPress={onConfirm}
        >
          {t('migrateToWorld.confirm.button')}
        </Button>
      </View>
    </View>
  )
}

export default ReviewStep
