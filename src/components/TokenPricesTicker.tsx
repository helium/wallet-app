import React, { memo, useMemo } from 'react'
import { BoxProps } from '@shopify/restyle'
import { Easing } from 'react-native'
import TextTicker from 'react-native-text-ticker'
import { useTranslation } from 'react-i18next'
import { useTextVariants, useColors } from '@theme/themeHooks'
import { Theme } from '@theme/theme'
import { useSelector } from 'react-redux'
import Box from './Box'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'

type Props = BoxProps<Theme>
const TokenPricesTicker = ({ ...boxProps }: Props) => {
  const { t } = useTranslation()
  const { body2 } = useTextVariants()
  const colors = useColors()
  const { currency: currencyRaw } = useAppStorage()
  const currency = useMemo(() => currencyRaw.toLowerCase(), [currencyRaw])
  const tokenPrices = useSelector(
    (state: RootState) => state.balances.tokenPrices,
  )

  const textStyle = useMemo(
    () => ({ ...body2, fontSize: 16, color: colors.secondaryText }),
    [body2, colors],
  )

  const text = useMemo(() => {
    if (!tokenPrices) return t('generic.noData')

    const heliumPrice = tokenPrices?.helium[currency]
    const solanaPrice = tokenPrices?.solana[currency]
    const mobilePrice = tokenPrices['helium-mobile'][currency]
    const iotPrice = tokenPrices['helium-iot'][currency]

    // Construct the text to display
    let priceText = ''
    if (heliumPrice) priceText += ` HNT = $${heliumPrice} • `
    if (solanaPrice) priceText += `SOL = $${solanaPrice} • `
    if (mobilePrice) priceText += `MOBILE = $${mobilePrice} • `
    if (iotPrice) priceText += `IOT = $${iotPrice} • `
    return priceText.slice(0, -3)
  }, [currency, t, tokenPrices])

  return (
    <Box {...boxProps}>
      <TextTicker
        style={textStyle}
        scrollSpeed={200}
        repeatSpacer={0}
        animationType="auto"
        loop
        easing={Easing.linear}
        maxFontSizeMultiplier={1.2}
      >
        {text}
      </TextTicker>
    </Box>
  )
}

export default memo(TokenPricesTicker)
