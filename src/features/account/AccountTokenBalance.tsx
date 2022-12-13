import { Ticker } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { Theme } from '../../theme/theme'
import { useBalance } from '../../utils/Balance'

type Props = {
  ticker: Ticker
  textVariant?: 'h0' | 'h1' | 'h2'
  showTicker?: boolean
} & BoxProps<Theme>

const AccountTokenBalance = ({
  ticker,
  textVariant,
  showTicker = true,
  ...boxProps
}: Props) => {
  const {
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
  } = useBalance()

  const balance = useMemo(() => {
    switch (ticker) {
      default:
      case 'HNT': {
        if (networkBalance && networkStakedBalance)
          return networkBalance.plus(networkStakedBalance)

        if (networkBalance) return networkBalance
        return networkStakedBalance
      }
      case 'MOBILE':
        return mobileBalance
      case 'DC':
        return dcBalance
      case 'HST':
        return secBalance
    }
  }, [
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    ticker,
  ])

  return (
    <Box flexDirection="row" justifyContent="center" {...boxProps}>
      <Text
        variant={textVariant || 'h1'}
        color="primaryText"
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        adjustsFontSizeToFit
      >
        {`${balance?.toString(2, { showTicker: false })} `}
      </Text>
      {showTicker && (
        <Text
          variant={textVariant || 'h1'}
          color="secondaryText"
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
        >
          {balance?.type.ticker}
        </Text>
      )}
    </Box>
  )
}

export default memo(AccountTokenBalance)
