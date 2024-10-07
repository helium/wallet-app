import Box from '@components/Box'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import { useCreateOpacity } from '@theme/themeHooks'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Pressable } from 'react-native'

export type SwapItemProps = {
  isPaying: boolean
  onCurrencySelect: () => void
  mintSelected: PublicKey
  amount: number
  loading?: boolean
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
} & BoxProps<Theme>

const SwapItem = ({
  isPaying,
  onCurrencySelect,
  mintSelected,
  amount,
  loading = false,
  onPress,
  disabled,
  ...rest
}: SwapItemProps) => {
  const { t } = useTranslation()
  const { symbol } = useMetaplexMetadata(mintSelected)

  const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        return generateBackgroundStyle('cardBackground', 0.7)
      }
      return generateBackgroundStyle('cardBackground', 1.0)
    },
    [generateBackgroundStyle],
  )

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <Box
          style={getBackgroundColorStyle(pressed)}
          borderRadius="4xl"
          padding="xl"
          {...rest}
        >
          <Box flexDirection={'row'} gap="2.5">
            <Box>
              <TokenPill
                mint={mintSelected}
                hasCarot
                onPress={onCurrencySelect}
                hasTicker={false}
              />
            </Box>
            <Box>
              <Text variant="textSmRegular" color="text.quaternary-500">
                {isPaying
                  ? t('swapsScreen.youPay')
                  : t('swapsScreen.youReceive')}
              </Text>
              <Box flexDirection="row">
                <Text
                  marginEnd="1"
                  variant="textLgSemibold"
                  color="text.placeholder"
                >
                  {!loading ? amount.toString() : t('generic.loading')}
                </Text>
                <Text
                  variant="textLgSemibold"
                  color="primaryText"
                >{`${symbol}`}</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Pressable>
  )
}

export default memo(SwapItem)
