import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { SelectableToken } from '../logic/types'
import { WORLD } from '../migrationTheme'

type Props = {
  tokens: SelectableToken[]
  amounts: Record<string, string>
  onCommit: (amounts: Record<string, string>) => void
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

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
        onChange={handleChange}
        onClose={handleClose}
      >
        <BottomSheetScrollView>
          <Box paddingHorizontal="l" paddingBottom="s">
            <Text variant="h4" color="primaryText">
              {t('migrateToWorld.selectAssets.tokens')}
            </Text>
          </Box>
          {tokens.map((tk) => (
            <Box key={tk.mint} paddingHorizontal="l" paddingVertical="m">
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text variant="body2Medium" color="primaryText">
                  {tk.label}
                </Text>
                <TouchableOpacityBox onPress={() => setMax(tk)}>
                  <Text variant="body3" color="worldPurple" fontWeight="700">
                    {t('migrateToWorld.selectAssets.max')}
                  </Text>
                </TouchableOpacityBox>
              </Box>
              <Text variant="body3" color="secondaryText" marginTop="xs">
                {t('migrateToWorld.selectAssets.balance', { amount: tk.maxUi })}
              </Text>
              <Box
                backgroundColor="surfaceSecondary"
                borderRadius="m"
                marginTop="xs"
                paddingHorizontal="m"
              >
                <TextInput
                  value={draft[tk.mint] ?? ''}
                  onChangeText={(v) => setAmount(tk.mint, v)}
                  placeholder="0"
                  placeholderTextColor={WORLD.inkFaint}
                  keyboardType="decimal-pad"
                  style={{
                    color: WORLD.ink,
                    fontSize: 15,
                    paddingVertical: 12,
                  }}
                />
              </Box>
            </Box>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    )
  },
)

TokensEditSheet.displayName = 'TokensEditSheet'

export default TokensEditSheet
