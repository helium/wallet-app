import { Ticker } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import Box from '@components/Box'
import { Theme } from '@theme/theme'
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
    iotBalance,
    solBalance,
    hntBalance,
    dcEscrowBalance,
  } = useBalance()
  const { t } = useTranslation()

  const balance = useMemo(() => {
    switch (ticker) {
      default:
      case 'HNT': {
        return hntBalance
      }
      case 'MOBILE':
        return mobileBalance
      case 'IOT':
        return iotBalance
      case 'SOL':
        return solBalance
      case 'DC':
        return dcBalance
    }
  }, [dcBalance, mobileBalance, hntBalance, solBalance, iotBalance, ticker])

  const tokenDetails = useMemo(() => {
    if (ticker !== 'DC' || !showTicker) return

    return (
      <Box>
        <Text variant="body1" color="secondaryText" textAlign="center">
          {t('accountsScreen.receivedBalance', {
            amount: dcEscrowBalance?.toString(2, { showTicker: false }),
          })}
        </Text>
      </Box>
    )
  }, [ticker, showTicker, t, dcEscrowBalance])

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
