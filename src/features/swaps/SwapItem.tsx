import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Balance, { SolTokens, Ticker } from '@helium/currency'
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import { useCreateOpacity } from '../../theme/themeHooks'
import Text from '../../components/Text'
import Box from '../../components/Box'
import CarotDown from '../../assets/images/carotDownFull.svg'
import TokenIcon from '../../components/TokenIcon'
import { Theme } from '../../theme/theme'

export type SwapItemProps = {
  isPaying: boolean
  onCurrencySelect: () => void
  currencySelected: Ticker
  amount: Balance<SolTokens>
  loading?: boolean
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
} & BoxProps<Theme>

const SwapItem = ({
  isPaying,
  onCurrencySelect,
  currencySelected,
  amount,
  loading = false,
  onPress,
  disabled,
  ...rest
}: SwapItemProps) => {
  const { t } = useTranslation()

  const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

  const getBackgroundColorStylePill = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        return generateBackgroundStyle('surfaceSecondary', 1.0)
      }
      return generateBackgroundStyle('secondary', 1.0)
    },
    [generateBackgroundStyle],
  )

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        return generateBackgroundStyle('black500', 1.0)
      }
      return generateBackgroundStyle('surfaceSecondary', 1.0)
    },
    [generateBackgroundStyle],
  )

  const Pill = useMemo(() => {
    return (
      <Box position="absolute" top={-22.5}>
        <Pressable onPress={onCurrencySelect}>
          {({ pressed }) => (
            <Box
              style={getBackgroundColorStylePill(pressed)}
              height={45}
              borderRadius="round"
              flexDirection="row"
              alignItems="center"
              shadowColor="black"
              shadowOpacity={0.2}
              shadowOffset={{ width: 0, height: 3 }}
              shadowRadius={3}
              padding="s"
            >
              <Box
                marginEnd="xs"
                width={32}
                height={32}
                backgroundColor="black"
                justifyContent="center"
                alignItems="center"
                borderRadius="round"
              >
                <TokenIcon ticker={currencySelected} size={24} />
              </Box>
              <Text
                variant="subtitle4"
                color="white"
                flexGrow={1}
                textAlign="center"
              >
                {currencySelected}
              </Text>
              <Box marginStart="xs" marginEnd="s" justifyContent="center">
                <CarotDown color="white" width={9} />
              </Box>
            </Box>
          )}
        </Pressable>
      </Box>
    )
  }, [currencySelected, getBackgroundColorStylePill, onCurrencySelect])

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <Box
          height={120}
          style={getBackgroundColorStyle(pressed)}
          borderRadius="xxl"
          {...rest}
        >
          <Box flex={1} justifyContent="center" alignItems="center">
            {Pill}
            <Text variant="body3" color="secondaryText" marginBottom="xs">
              {isPaying ? t('swapsScreen.youPay') : t('swapsScreen.youReceive')}
            </Text>
            <Box flexDirection="row">
              <Text marginEnd="s" variant="h4">
                {/** If last decimals are zeroes do not show */}
                {!loading ? amount.bigBalance.toString() : t('generic.loading')}
              </Text>
              <Text
                variant="h4"
                color="secondaryText"
              >{`${currencySelected}`}</Text>
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
