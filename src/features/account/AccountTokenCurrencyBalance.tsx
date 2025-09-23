import React, { useMemo } from 'react'
import Text, { TextProps } from '@components/Text'
import { useBalance } from '../../utils/Balance'

type Props = {
  ticker: string
} & TextProps

const AccountTokenCurrencyBalance = ({ ticker, ...textProps }: Props) => {
  const {
    formattedIotValue,
    formattedMobileValue,
    formattedSolValue,
    formattedDcValue,
    formattedHntValue,
    formattedTotal,
  } = useBalance()

  const balanceString = useMemo(() => {
    const balanceValues = {
      ALL: formattedTotal,
      HNT: formattedHntValue,
      SOL: formattedSolValue,
      DC: formattedDcValue,
      MOBILE: formattedMobileValue,
      IOT: formattedIotValue,
    }

    const value = balanceValues[ticker as keyof typeof balanceValues]

    if (value === undefined || value === '') {
      return undefined
    }

    if (value === '0.00' || value === '$0.00' || value === '0') {
      return value
    }

    return value || '-'
  }, [
    formattedDcValue,
    formattedHntValue,
    formattedIotValue,
    formattedMobileValue,
    formattedSolValue,
    ticker,
    formattedTotal,
  ])

  if (balanceString === undefined) {
    return (
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1}
        {...textProps}
      >
        ...
      </Text>
    )
  }

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={1}
      {...textProps}
    >
      {balanceString}
    </Text>
  )
}

export default AccountTokenCurrencyBalance
