import { Ticker } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import Box from '@components/Box'
import { Theme } from '@theme/theme'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useBalance } from '../../utils/Balance'

type Props = {
  ticker: Ticker
  textVariant?: 'h0' | 'h1' | 'h2' | 'h2Medium'
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
    mobileSolBalance,
    iotBalance,
    iotSolBalance,
    solBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
  } = useBalance()

  const { l1Network } = useAppStorage()

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
        return l1Network === 'solana' ? mobileSolBalance : mobileBalance
      case 'IOT':
        return l1Network === 'solana' ? iotSolBalance : iotBalance
      case 'SOL':
        return solBalance
      case 'DC':
        return dcBalance
      case 'HST':
        return secBalance
    }
  }, [
    l1Network,
    dcBalance,
    mobileBalance,
    mobileSolBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
    iotBalance,
    iotSolBalance,
    ticker,
  ])

  return (
    <Box flexDirection="row" justifyContent="center" {...boxProps}>
      {!showTicker && (
        <Text
          variant={textVariant || 'h1'}
          color="primaryText"
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
        >
          {typeof balance === 'number'
            ? balance
            : `${balance?.toString(2, { showTicker: false })}`}
        </Text>
      )}
      {showTicker && (
        <TextTransform
          variant={textVariant || 'h1'}
          color="primaryText"
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
          i18nKey="accountsScreen.tokenBalance"
          values={{
            amount:
              typeof balance === 'number'
                ? balance
                : balance?.toString(2, { showTicker: false }),
            ticker,
          }}
        />
      )}
    </Box>
  )
}

export default memo(AccountTokenBalance)
