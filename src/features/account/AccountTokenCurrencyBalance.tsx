import React, { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import { Ticker } from '@helium/currency'
import Text, { TextProps } from '@components/Text'
import * as AccountUtils from '../../utils/accountUtils'
import { useBalance } from '../../utils/Balance'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { locale } from '../../utils/i18n'

type Props = {
  ticker: Ticker | 'ALL'
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
    solBalance,
    networkStakedBalance,
    mobileBalance,
    iotBalance,
    totalBalance,
  } = useBalance()

  useAsync(async () => {
    if (accountNetType !== NetTypes.MAINNET) {
      setBalanceString(t('accountView.testnetTokens'))
      return
    }

    switch (ticker) {
      case 'ALL':
        totalBalance().then(setBalanceString)
        break
      case 'HNT':
        toCurrencyString(
          networkStakedBalance
            ? networkBalance?.plus(networkStakedBalance)
            : networkBalance,
        ).then(setBalanceString)
        break
      case 'SOL':
        toCurrencyString(solBalance, 'SOL').then(setBalanceString)
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
        toCurrencyString(mobileBalance, 'MOBILE').then(setBalanceString)
        break
      case 'IOT':
        toCurrencyString(iotBalance, 'IOT').then(setBalanceString)
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
      maxFontSizeMultiplier={1}
      {...textProps}
    >
      {balanceString || ' '}
    </Text>
  )
}

export default AccountTokenCurrencyBalance
