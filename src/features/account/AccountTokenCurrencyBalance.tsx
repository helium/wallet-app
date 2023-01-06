import React, { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import { Ticker } from '@helium/currency'
import * as AccountUtils from '../../utils/accountUtils'
import { useBalance } from '../../utils/Balance'
import Text, { TextProps } from '../../components/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { locale } from '../../utils/i18n'

type Props = {
  ticker: Ticker
  staked?: boolean
} & TextProps

const AccountTokenCurrencyBalance = ({
  ticker,
  staked = false,
  ...textProps
}: Props) => {
  const { t } = useTranslation()
  const [balanceString, setBalanceString] = useState('')
  const { currentAccount } = useAccountStorage()

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(currentAccount?.address),
    [currentAccount],
  )

  const {
    toCurrencyString,
    oraclePrice,
    dcBalance,
    networkBalance,
    networkStakedBalance,
  } = useBalance()

  useAsync(async () => {
    if (accountNetType !== NetTypes.MAINNET) {
      setBalanceString(t('accountView.testnetTokens'))
      return
    }

    switch (ticker) {
      case 'HNT':
        if (staked) {
          toCurrencyString(networkStakedBalance).then(setBalanceString)
        } else {
          toCurrencyString(networkBalance).then(setBalanceString)
        }
        break
      case 'DC': {
        const balance = dcBalance
          ?.toUsd(oraclePrice)
          .floatBalance.toLocaleString(locale, { maximumFractionDigits: 2 })
        setBalanceString(
          `$${balance || '0.00'} • ${t('accountView.nonTransferable')}`,
        )
        break
      }
      case 'MOBILE':
        setBalanceString(t('accountView.genesis'))
        break
      case 'IOT':
        setBalanceString(t('accountView.genesis'))
        break
      case 'HST':
        setBalanceString(t('accountView.securityTokens'))
        break
      default:
        setBalanceString('-')
    }
  }, [
    accountNetType,
    dcBalance,
    networkBalance,
    networkStakedBalance,
    oraclePrice,
    staked,
    t,
    toCurrencyString,
    ticker,
  ])

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={1.3}
      {...textProps}
    >
      {balanceString || ' '}
    </Text>
  )
}

export default AccountTokenCurrencyBalance
