import Box from '@components/Box'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import React, { FC, forwardRef, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { WSOL_MINT } from '../logic/mints'
import { SelectableToken } from '../logic/types'
import {
  WORLD,
  WORLD_INPUT,
  WORLD_SHEET,
  WORLD_TRACKING,
} from '../migrationTheme'
import WorldCheckbox from './WorldCheckbox'

type Props = {
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
  const mint = useMemo(() => new PublicKey(token.mint), [token.mint])
  const { json } = useMetaplexMetadata(mint)
  const isSol = token.mint === WSOL_MINT

  if (!isSol) {
    const isSelected = value !== '' && value !== '0'
    return (
      <TouchableOpacityBox
        onPress={() => onChange(isSelected ? '0' : token.maxUi)}
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="l"
        paddingVertical="ms"
      >
        <Box marginRight="m">
          <WorldCheckbox checked={isSelected} />
        </Box>
        <TokenIcon size={32} img={json?.image} />
        <Box flex={1} marginLeft="s">
          <Text variant="body2Medium" color="worldInk">
            {token.label}
          </Text>
          <Text variant="body3" color="worldSecondaryInk" marginTop="xxs">
            {t('migrateToWorld.selectAssets.balance', {
              amount: token.maxUi,
            })}
          </Text>
        </Box>
      </TouchableOpacityBox>
    )
  }

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingHorizontal="l"
      paddingVertical="ms"
    >
      {/* Spacer matching the checkbox column so the SOL row's icon/label
          stay aligned with the toggle rows above. */}
      <Box width={22} marginRight="m" />
      <TokenIcon size={32} img={json?.image} />
      <Box flex={1} marginLeft="s">
        <Text variant="body2Medium" color="worldInk">
          {token.label}
        </Text>
        <TouchableOpacityBox
          onPress={onMax}
          flexDirection="row"
          marginTop="xxs"
        >
          <Text variant="body3" color="worldSecondaryInk">
            {t('migrateToWorld.selectAssets.balance', { amount: token.maxUi })}
          </Text>
          <Text variant="body3Bold" color="worldPurple" marginLeft="xs">
            {t('migrateToWorld.selectAssets.max')}
          </Text>
        </TouchableOpacityBox>
      </Box>
      <Box
        backgroundColor="worldSurface"
        borderRadius="l"
        borderWidth={1}
        borderColor="worldBorder"
        paddingHorizontal="m"
        minWidth={110}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={WORLD.inkFaint}
          keyboardType="decimal-pad"
          textAlign="right"
          style={WORLD_INPUT}
        />
      </Box>
    </Box>
  )
}

const TokensEditSheet = forwardRef<BottomSheet, Props>(
  ({ tokens, amounts, onCommit }, ref) => {
    const { t } = useTranslation()
    // Edit against a local draft so keystrokes don't re-render the whole
    // selection step (and both sheets) per keypress. Re-seed from the committed
    // values whenever the sheet opens; push the draft back to the parent on
    // close. The sheet occludes the Review button while open, so Review can only
    // be tapped after a commit.
    const [draft, setDraft] = useState(amounts)

    const handleChange = useCallback(
      (index: number) => {
        if (index >= 0) setDraft(amounts)
      },
      [amounts],
    )
    const handleClose = useCallback(() => onCommit(draft), [onCommit, draft])

    const setAmount = (mint: string, ui: string) =>
      setDraft((prev) => ({ ...prev, [mint]: ui }))
    const setMax = (tk: SelectableToken) =>
      setDraft((prev) => ({ ...prev, [tk.mint]: tk.maxUi }))

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      [],
    )

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
        backgroundStyle={WORLD_SHEET.background}
        handleIndicatorStyle={WORLD_SHEET.handle}
        backdropComponent={renderBackdrop}
        onChange={handleChange}
        onClose={handleClose}
      >
        <BottomSheetScrollView>
          <Box paddingHorizontal="l" paddingBottom="s">
            <Text
              variant="h4"
              color="worldInk"
              letterSpacing={WORLD_TRACKING.title}
            >
              {t('migrateToWorld.selectAssets.tokens')}
            </Text>
          </Box>
          {tokens.map((tk) => (
            <TokenRow
              key={tk.mint}
              token={tk}
              value={draft[tk.mint] ?? ''}
              onChange={(v) => setAmount(tk.mint, v)}
              onMax={() => setMax(tk)}
            />
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    )
  },
)

TokensEditSheet.displayName = 'TokensEditSheet'

export default TokensEditSheet
