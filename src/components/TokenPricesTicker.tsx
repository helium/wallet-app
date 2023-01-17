import React, { memo, useMemo } from 'react'
import { BoxProps } from '@shopify/restyle'
import { Easing } from 'react-native'
import TextTicker from 'react-native-text-ticker'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Box from './Box'
import { useLazyGetTokenPricesQuery } from '../store/slices/walletRestApi'
import { useTextVariants, useColors } from '../theme/themeHooks'
import { Theme } from '../theme/theme'
import { useAppStorage } from '../storage/AppStorageProvider'

type Props = BoxProps<Theme>
const TokenPricesTicker = ({ ...boxProps }: Props) => {
  const { body2 } = useTextVariants()
  const colors = useColors()
  const { currency } = useAppStorage()
  const { t } = useTranslation()

  const textStyle = useMemo(
    () => ({ ...body2, fontSize: 16, color: colors.secondaryText }),
    [body2, colors],
  )

  const [triggerGetTokenPrices, { isFetching, data: tokenPrices }] =
    useLazyGetTokenPricesQuery({
      pollingInterval: 1000 * 60,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    })

  useAsync(async () => {
    await triggerGetTokenPrices({ tokens: 'helium,solana', currency }, false)
  }, [currency, triggerGetTokenPrices])

  const text = useMemo(() => {
    if (!tokenPrices) return t('generic.noData')
    if (isFetching || !tokenPrices.helium || !tokenPrices.solana)
      return t('generic.loading')

    const heliumPrice = tokenPrices.helium[currency.toLowerCase()]
    const solanaPrice = tokenPrices.solana[currency.toLowerCase()]

    return `HNT = $${heliumPrice} • SOL = $${solanaPrice}`
  }, [currency, isFetching, t, tokenPrices])

  return (
    <Box {...boxProps}>
      <TextTicker
        style={textStyle}
        scrollSpeed={200}
        loop
        repeatSpacer={0}
        easing={Easing.linear}
        maxFontSizeMultiplier={1.2}
      >
        {text}
      </TextTicker>
    </Box>
  )
}

export default memo(TokenPricesTicker)
