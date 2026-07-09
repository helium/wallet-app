import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet from '@gorhom/bottom-sheet'
import { useAppStorage } from '@storage/AppStorageProvider'
import { numberFormat } from '@utils/Balance'
import { useLanguage } from '@utils/i18n'
import { usePollTokenPrices } from '@utils/usePollTokenPrices'
import React, { FC, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MigratableHotspot } from '../hooks/useMigrationAssets'
import { MINT_PRICE_KEY } from '../logic/mints'
import { SelectableToken } from '../logic/types'
import { WORLD } from '../migrationTheme'
import HotspotsEditSheet from './HotspotsEditSheet'
import StepBackHeader from './StepBackHeader'
import TokensEditSheet from './TokensEditSheet'
import WorldButton from './WorldButton'

export type AssetSelection = {
  hotspotKeys: Set<string>
  tokenAmounts: Record<string, string>
}

const SummaryCard: FC<{
  count: number
  label: string
  sub?: string
  onEdit: () => void
}> = ({ count, label, sub, onEdit }) => {
  const { t } = useTranslation()
  return (
    <Box
      backgroundColor="surfaceSecondary"
      borderRadius="xl"
      padding="l"
      marginBottom="m"
    >
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Text variant="h1" color="primaryText">
            {count}
          </Text>
          <Text variant="body3" color="secondaryText" marginTop="xs">
            {label}
          </Text>
        </Box>
        <TouchableOpacityBox onPress={onEdit}>
          <Text variant="body3Medium" style={{ color: WORLD.purple }}>
            {t('migrateToWorld.selectAssets.edit')} ›
          </Text>
        </TouchableOpacityBox>
      </Box>
      {sub ? (
        <Text variant="body3" color="secondaryText" marginTop="s">
          {sub}
        </Text>
      ) : null}
    </Box>
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
  const { tokenPrices } = usePollTokenPrices()
  const hotspotsRef = useRef<BottomSheet>(null)
  const tokensRef = useRef<BottomSheet>(null)

  const [hotspotKeys, setHotspotKeys] = useState<Set<string>>(new Set())
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, string>>({})
  const [primed, setPrimed] = useState(false)

  // Pre-select everything the first time assets arrive. Adjusting state
  // during render (guarded so it runs once) is the idiomatic React pattern
  // for deriving state from new props without an extra effect pass.
  if (!primed && (hotspots.length || tokens.length)) {
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

  const setMax = (mint: string) => {
    const tk = tokens.find((x) => x.mint === mint)
    if (tk) setTokenAmounts((prev) => ({ ...prev, [mint]: tk.maxUi }))
  }

  const activeTokenCount = tokens.filter((tk) => {
    const a = tokenAmounts[tk.mint]
    return a && a !== '0'
  }).length

  // Approximate USD value of the selected token amounts, summed over the mints
  // we have a price for. Omitted entirely when no price is available.
  const cur = currency?.toLowerCase()
  const tokensUsd = useMemo(() => {
    if (!cur || !tokenPrices) return undefined
    let total = 0
    let priced = false
    tokens.forEach((tk) => {
      const key = MINT_PRICE_KEY[tk.mint]
      const price = key
        ? tokenPrices[key as keyof typeof tokenPrices]?.[cur]
        : undefined
      const amt = parseFloat(tokenAmounts[tk.mint] ?? '')
      if (price && amt > 0) {
        total += price * amt
        priced = true
      }
    })
    if (!priced) return undefined
    return t('migrateToWorld.selectAssets.approxValue', {
      value: numberFormat(language, cur, total),
    })
  }, [tokens, tokenAmounts, tokenPrices, cur, language, t])

  const canReview = hotspotKeys.size > 0 || activeTokenCount > 0

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <CircleLoader loaderSize={30} color="worldPurple" />
        <Text variant="body3" color="secondaryText" marginTop="m">
          {t('migrateToWorld.selectAssets.loading')}
        </Text>
      </Box>
    )
  }

  return (
    <Box flex={1}>
      <StepBackHeader onBack={onBack} />
      <Box flex={1} paddingHorizontal="l">
        <Text variant="h4" color="primaryText">
          {t('migrateToWorld.selectAssets.readyTitle')}
        </Text>
        <Text
          variant="body3"
          color="secondaryText"
          marginTop="xs"
          marginBottom="l"
        >
          {t('migrateToWorld.selectAssets.readyBody')}
        </Text>

        <SummaryCard
          count={hotspotKeys.size}
          label={t('migrateToWorld.selectAssets.hotspots')}
          onEdit={() => hotspotsRef.current?.expand()}
        />
        <SummaryCard
          count={activeTokenCount}
          label={t('migrateToWorld.selectAssets.tokens')}
          sub={tokensUsd}
          onEdit={() => tokensRef.current?.expand()}
        />

        {leftBehindCount > 0 && (
          <Box
            borderRadius="l"
            padding="m"
            style={{ backgroundColor: WORLD.warnBg }}
          >
            <Text variant="body3" style={{ color: WORLD.warnInk }}>
              ⚠{' '}
              {t('migrateToWorld.selectAssets.leftBehind', {
                count: leftBehindCount,
              })}
            </Text>
          </Box>
        )}

        <Box flex={1} />
        <WorldButton
          title={t('migrateToWorld.selectAssets.review')}
          onPress={() => onReview({ hotspotKeys, tokenAmounts })}
          disabled={!canReview}
          marginBottom="l"
        />
      </Box>

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
        onChange={(mint, ui) =>
          setTokenAmounts((prev) => ({ ...prev, [mint]: ui }))
        }
        onMax={setMax}
      />
    </Box>
  )
}

export default AssetSelectionStep
