import { Ticker } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import Box from '@components/Box'
import { Theme } from '@theme/theme'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useTranslation } from 'react-i18next'
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
    dcDelegatedBalance,
    dcReceivedBalance,
  } = useBalance()
  const { t } = useTranslation()

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

  const tokenDetails = useMemo(() => {
    if (ticker !== 'DC' || !showTicker) return

    return (
      <Box>
        <Text variant="body1" color="secondaryText" textAlign="center">
          {t('accountsScreen.receivedBalance', {
            amount: dcReceivedBalance?.toString(2, { showTicker: false }),
          })}
        </Text>
        <Text variant="body1" color="secondaryText" textAlign="center">
          {t('accountsScreen.delegatedBalance', {
            amount: dcDelegatedBalance?.toString(2, { showTicker: false }),
          })}
        </Text>
      </Box>
    )
  }, [ticker, showTicker, t, dcReceivedBalance, dcDelegatedBalance])

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
      <Box>
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
        {tokenDetails}
      </Box>
    </Box>
  )
}

export default memo(AccountTokenBalance)
