import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet'
import { Checkbox } from '@ui/Checkbox'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useTokenDisplay } from '../hooks/useTokenDisplay'
import { WSOL_MINT } from '../logic/mints'
import { SelectableToken } from '../logic/types'

type Props = {
  ref?: React.Ref<BottomSheetModal>
  tokens: SelectableToken[]
  amounts: Record<string, string>
  onCommit: (amounts: Record<string, string>) => void
}

// SOL keeps a free-form amount input (users typically hold back gas on the old
// wallet); every other token migrates full-balance-or-nothing — the backend
// only sponsors transfers that close the source ATA — so those rows are a
// simple include/exclude toggle at max balance.
const TokenRow: FC<{
  token: SelectableToken
  value: string
  onChange: (ui: string) => void
  onMax: () => void
}> = ({ token, value, onChange, onMax }) => {
  const { t } = useTranslation()
  const { label, image } = useTokenDisplay(token.mint, token.label)
  const isSol = token.mint === WSOL_MINT

  if (!isSol) {
    const isSelected = value !== '' && value !== '0'
    return (
      <PressableScale
        onPress={() => onChange(isSelected ? '0' : token.maxUi)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        feedback="opacity"
        className="flex-row items-center px-6 py-3"
      >
        <Checkbox
          checked={isSelected}
          accessible={false}
          importantForAccessibility="no"
          onChange={(next) => onChange(next ? token.maxUi : '0')}
          className="mr-4"
        />
        <TokenIcon size={32} img={image} />
        <View className="ml-2 flex-1">
          <Text className="font-medium">{label}</Text>
          <Text size="xs" className="mt-0.5 text-muted-foreground">
            {t('migrateToWorld.selectAssets.balance', {
              amount: token.maxUi,
            })}
          </Text>
        </View>
      </PressableScale>
    )
  }

  return (
    <View className="flex-row items-center px-6 py-3">
      {/* Spacer matching the checkbox column so the SOL row's icon/label
          stay aligned with the toggle rows above. */}
      <View className="mr-4 w-4" />
      <TokenIcon size={32} img={image} />
      <View className="ml-2 flex-1">
        <Text className="font-medium">{label}</Text>
        <PressableScale
          onPress={onMax}
          feedback="opacity"
          className="mt-0.5 flex-row gap-1"
        >
          <Text size="xs" className="text-muted-foreground">
            {t('migrateToWorld.selectAssets.balance', { amount: token.maxUi })}
          </Text>
          <Text size="xs" className="font-bold text-purple-700">
            {t('migrateToWorld.selectAssets.max')}
          </Text>
        </PressableScale>
      </View>
      <Input
        value={value}
        onChangeText={onChange}
        placeholder="0"
        keyboardType="decimal-pad"
        textAlign="right"
        className="h-12 w-auto min-w-[110px]"
      />
    </View>
  )
}

const TokensEditSheet = ({ ref, tokens, amounts, onCommit }: Props) => {
  const { t } = useTranslation()
  // Edit against a local draft so keystrokes don't re-render the whole
  // selection step (and both sheets) per keypress. Re-seed from the committed
  // values whenever the sheet opens; push the draft back to the parent on
  // dismiss. The sheet occludes the Review button while open, so Review can
  // only be tapped after a commit.
  const [draft, setDraft] = useState(amounts)

  const setAmount = (mint: string, ui: string) =>
    setDraft((prev) => ({ ...prev, [mint]: ui }))
  const setMax = (tk: SelectableToken) =>
    setDraft((prev) => ({ ...prev, [tk.mint]: tk.maxUi }))

  return (
    <Sheet
      ref={ref}
      snapPoints={['70%']}
      enablePanDownToClose
      onChange={(index) => {
        if (index >= 0) setDraft(amounts)
      }}
      onDismiss={() => onCommit(draft)}
    >
      <View className="px-6 pb-2">
        <Text size="xl" className="tracking-tight">
          {t('migrateToWorld.selectAssets.tokens')}
        </Text>
      </View>
      <BottomSheetFlatList<SelectableToken>
        contentInsetAdjustmentBehavior="automatic"
        data={tokens}
        keyExtractor={(tk) => tk.mint}
        renderItem={({ item: tk }) => (
          <TokenRow
            token={tk}
            value={draft[tk.mint] ?? ''}
            onChange={(v) => setAmount(tk.mint, v)}
            onMax={() => setMax(tk)}
          />
        )}
      />
    </Sheet>
  )
}

export default TokensEditSheet
