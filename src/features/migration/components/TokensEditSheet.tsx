import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { SelectableToken } from '../logic/types'
import { WORLD } from '../migrationTheme'

type Props = {
  tokens: SelectableToken[]
  amounts: Record<string, string>
  onChange: (mint: string, ui: string) => void
  onMax: (mint: string) => void
}

const TokensEditSheet = forwardRef<BottomSheet, Props>(
  ({ tokens, amounts, onChange, onMax }, ref) => {
    const { t } = useTranslation()
    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
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
                <TouchableOpacityBox onPress={() => onMax(tk.mint)}>
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
                  value={amounts[tk.mint] ?? ''}
                  onChangeText={(v) => onChange(tk.mint, v)}
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
