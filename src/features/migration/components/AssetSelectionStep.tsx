import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useQuery } from '@tanstack/react-query'
import { numberFormat } from '@utils/Balance'
import { tokenPricesQueryOptions } from '@utils/balances'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { useLanguage } from '@utils/i18n'
import { ChevronRight } from 'lucide-react-native'
import React, { FC, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { MigratableHotspot } from '../hooks/useMigrationAssets'
import { estimateFiat } from '../logic/fiat'
import { SelectableToken } from '../logic/types'
import HotspotsEditSheet from './HotspotsEditSheet'
import StepBackHeader from './StepBackHeader'
import TokensEditSheet from './TokensEditSheet'
import WorldLoader from './WorldLoader'

export type AssetSelection = {
  hotspotKeys: Set<string>
  tokenAmounts: Record<string, string>
}

const EditIcon = withUniwind(ChevronRight)

// The whole card is the tap target (the old 12pt "Edit" label alone was far
// below a 44pt target); the trailing Edit affordance is decorative.
const SummaryCard: FC<{
  count: number
  label: string
  sub?: string
  onEdit: () => void
}> = ({ count, label, sub, onEdit }) => {
  const { t } = useTranslation()
  return (
    <PressableScale
      onPress={onEdit}
      className="mb-2 flex-row items-center rounded-[20px] border border-border bg-secondary px-6 py-4"
    >
      <View className="size-10 items-center justify-center rounded-full bg-purple-50">
        <Text size="base" className="font-bold text-purple-700">
          {count}
        </Text>
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-medium">{label}</Text>
        {sub ? (
          <Text size="xs" className="mt-0.5 text-muted-foreground">
            {sub}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1">
        <Text size="xs" className="font-medium text-purple-700">
          {t('migrateToWorld.selectAssets.edit')}
        </Text>
        <EditIcon size={14} colorClassName="accent-purple-700" />
      </View>
    </PressableScale>
  )
}

const AssetSelectionStep: FC<{
  hotspots: MigratableHotspot[]
  tokens: SelectableToken[]
  leftBehindCount: number
  loading: boolean
  onBack: () => void
  onReview: (sel: AssetSelection) => void
}> = ({ hotspots, tokens, leftBehindCount, loading, onBack, onReview }) => {
  const { t } = useTranslation()
  const { currency } = useAppStorage()
  const { language } = useLanguage()
  const cur = currency?.toLowerCase()
  // Read prices straight from the cache — BalanceProvider already polls, so a
  // second app-wide interval just for this subtitle would be redundant.
  const { data: tokenPrices } = useQuery({
    ...tokenPricesQueryOptions(cur || ''),
    enabled: false,
  })
  const hotspotsRef = useRef<BottomSheetModal>(null)
  const tokensRef = useRef<BottomSheetModal>(null)

  const [hotspotKeys, setHotspotKeys] = useState<Set<string>>(new Set())
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, string>>({})
  const [primed, setPrimed] = useState(false)

  // Pre-select everything the first time assets arrive. Adjusting state
  // during render (guarded so it runs once) is the idiomatic React pattern
  // for deriving state from new props without an extra effect pass. `loading`
  // covers hotspots, token accounts and SOL, so nothing arrives after the prime
  // and lands unselected.
  if (!primed && !loading && (hotspots.length || tokens.length)) {
    setHotspotKeys(new Set(hotspots.map((h) => h.entityKey)))
    setTokenAmounts(Object.fromEntries(tokens.map((tk) => [tk.mint, tk.maxUi])))
    setPrimed(true)
  }

  const toggleHotspot = (key: string) =>
    setHotspotKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const activeTokenCount = tokens.filter((tk) => {
    const a = tokenAmounts[tk.mint]
    return a && a !== '0'
  }).length

  // Approximate value of the selected token amounts over the mints we have a
  // price for, plus how many selected tokens we cannot price. Omitted entirely
  // until prices load, and when nothing is selected.
  const tokensUsd = (() => {
    if (!cur || !tokenPrices) return undefined
    const { total, unpricedCount } = estimateFiat({
      tokens,
      amounts: tokenAmounts,
      prices: tokenPrices,
      currency: cur,
    })
    if (!total && !unpricedCount) return undefined
    const value = numberFormat(language, cur, total)
    return unpricedCount
      ? t('migrateToWorld.selectAssets.approxValueUnpriced', {
          value,
          unpriced: unpricedCount,
        })
      : t('migrateToWorld.selectAssets.approxValue', { value })
  })()

  const canReview = hotspotKeys.size > 0 || activeTokenCount > 0

  if (loading) {
    return <WorldLoader caption={t('migrateToWorld.selectAssets.loading')} />
  }

  return (
    <View className="flex-1">
      <StepBackHeader onBack={onBack} />
      <View className="flex-1 px-6">
        <Text size="xl" className="tracking-tight">
          {t('migrateToWorld.selectAssets.readyTitle')}
        </Text>
        <Text className="mb-6 mt-1 text-muted-foreground">
          {t('migrateToWorld.selectAssets.readyBody')}
        </Text>

        <SummaryCard
          count={hotspotKeys.size}
          label={t('migrateToWorld.selectAssets.hotspots')}
          onEdit={() => hotspotsRef.current?.present()}
        />
        <SummaryCard
          count={activeTokenCount}
          label={t('migrateToWorld.selectAssets.tokens')}
          sub={tokensUsd}
          onEdit={() => tokensRef.current?.present()}
        />

        {leftBehindCount > 0 && (
          <View className="mt-1 rounded-[12px] bg-warning-100 p-4">
            <Text size="xs" className="text-foreground">
              {t('migrateToWorld.selectAssets.leftBehind', {
                count: leftBehindCount,
              })}{' '}
              {t('migrateToWorld.selectAssets.leftBehindHint')}
            </Text>
          </View>
        )}

        <View className="flex-1" />
        <Button
          variant="cta"
          size="dashboard"
          className="mb-6 w-full"
          testID="MigrateSelect.Review"
          onPress={() => onReview({ hotspotKeys, tokenAmounts })}
          disabled={!canReview}
        >
          {t('migrateToWorld.selectAssets.review')}
        </Button>
      </View>

      <HotspotsEditSheet
        ref={hotspotsRef}
        hotspots={hotspots}
        selected={hotspotKeys}
        onToggle={toggleHotspot}
      />
      <TokensEditSheet
        ref={tokensRef}
        tokens={tokens}
        amounts={tokenAmounts}
        onCommit={setTokenAmounts}
      />
    </View>
  )
}

export default AssetSelectionStep
