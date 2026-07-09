import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet from '@gorhom/bottom-sheet'
import React, { FC, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MigratableHotspot } from '../hooks/useMigrationAssets'
import { SelectableToken } from '../logic/types'
import { WORLD } from '../migrationTheme'
import HotspotsEditSheet from './HotspotsEditSheet'
import TokensEditSheet from './TokensEditSheet'

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
        <ButtonPressable
          width="100%"
          height={60}
          borderRadius="round"
          backgroundColor="worldPurple"
          backgroundColorOpacityPressed={0.7}
          titleColor="white"
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
