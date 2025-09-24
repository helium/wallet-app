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
    let value: string | undefined

    switch (ticker) {
      case 'ALL':
        value = formattedTotal
        break
      case 'HNT':
        value = formattedHntValue
        break
      case 'SOL':
        value = formattedSolValue
        break
      case 'DC':
        value = formattedDcValue
        break
      case 'MOBILE':
        value = formattedMobileValue
        break
      case 'IOT':
        value = formattedIotValue
        break
      default:
        value = '-'
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
