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
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native'

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
        return generateBackgroundStyle('gray.800', 1.0)
      }
      return generateBackgroundStyle('bg.tertiary', 1.0)
    },
    [generateBackgroundStyle],
  )

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <Box
          height={120}
          style={getBackgroundColorStyle(pressed)}
          borderRadius="4xl"
          {...rest}
        >
          <Box flex={1} justifyContent="center" alignItems="center">
            <Box position="absolute" top={-22.5}>
              <TokenPill
                mint={mintSelected}
                hasCarot
                onPress={onCurrencySelect}
              />
            </Box>
            <Text
              variant="textXsRegular"
              color="secondaryText"
              marginBottom="xs"
            >
              {isPaying ? t('swapsScreen.youPay') : t('swapsScreen.youReceive')}
            </Text>
            <Box flexDirection="row">
              <Text marginEnd="2" variant="textXlRegular">
                {!loading ? amount.toString() : t('generic.loading')}
              </Text>
              <Text
                variant="textXlRegular"
                color="secondaryText"
              >{`${symbol}`}</Text>
            </Box>
          </Box>
          {isPaying && (
            <Box
              position="absolute"
              bottom={0}
              alignSelf="center"
              style={[styles.rotatedBox, getBackgroundColorStyle(pressed)]}
            />
          )}
        </Box>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  rotatedBox: {
    height: 18,
    width: 18,
    margin: -9,
    transform: [{ rotate: '45deg' }],
  },
})

export default memo(SwapItem)
