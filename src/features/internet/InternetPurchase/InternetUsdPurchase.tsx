import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CardField, CardFieldInput } from '@stripe/stripe-react-native'
import InternetPurchaseLineItem from './InternetPurchaseLineItem'
import { useColors, useSpacing } from '../../../theme/themeHooks'
import Box from '../../../components/Box'

type Props = {
  visible: boolean
  usd: string
  onCardChange: (cardDetails: CardFieldInput.Details) => void
}

const InternetUsdPurchase = ({ visible, usd, onCardChange }: Props) => {
  const { t } = useTranslation()
  const colors = useColors()
  const spacing = useSpacing()

  const cardFieldParams = useMemo(
    () => ({
      placeholders: {
        number: t('internet.creditCardPlaceholder'),
        expiration: '06/27',
        cvc: '343',
      },
      cardStyle: {
        backgroundColor: colors.surfaceSecondary,
        borderColor: colors.grey800,
        borderWidth: 1,
        textColor: colors.primaryText,
        placeholderColor: colors.secondaryText,
      },
      style: {
        width: '100%',
        height: 43,
        marginVertical: spacing.l,
      },
    }),
    [
      colors.grey800,
      colors.primaryText,
      colors.secondaryText,
      colors.surfaceSecondary,
      spacing.l,
      t,
    ],
  )
  if (!visible) return null

  return (
    <Box paddingHorizontal="xl">
      <CardField
        postalCodeEnabled={false}
        onCardChange={onCardChange}
        placeholders={cardFieldParams.placeholders}
        cardStyle={cardFieldParams.cardStyle}
        style={cardFieldParams.style}
      />
      <InternetPurchaseLineItem
        paddingBottom="ms"
        title={t('generic.total')}
        value={usd}
      />
    </Box>
  )
}

export default memo(InternetUsdPurchase)
