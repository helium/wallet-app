import React, { useMemo } from 'react'
import { Ticker } from '@helium/currency'
import Text, { TextProps } from '@components/Text'
import { useBalance } from '../../utils/Balance'

type Props = {
  ticker: Ticker | 'ALL'
} & TextProps

const AccountTokenCurrencyBalance = ({ ticker, ...textProps }: Props) => {
  const {
    formattedIotValue,
    formattedMobileValue,
    formattedSolValue,
    formattedDcValue,
    formattedHntValue,
    totalValue,
  } = useBalance()

  const balanceString = useMemo(() => {
    switch (ticker) {
      case 'ALL':
        return totalValue
      case 'HNT':
        return formattedHntValue
      case 'SOL':
        return formattedSolValue
      case 'DC':
        return formattedDcValue
      case 'MOBILE':
        return formattedMobileValue
      case 'IOT':
        return formattedIotValue
      default:
        return '-'
    }
  }, [
    formattedDcValue,
    formattedHntValue,
    formattedIotValue,
    formattedMobileValue,
    formattedSolValue,
    ticker,
    totalValue,
  ])

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={1}
      {...textProps}
    >
      {balanceString || ' '}
    </Text>
  )
}

export default AccountTokenCurrencyBalance
