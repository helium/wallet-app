import React, { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import * as AccountUtils from '../../utils/accountUtils'
import { useAccountBalances, useBalance } from '../../utils/Balance'
import { AccountData, TokenType } from '../../generated/graphql'
import Text from '../../components/Text'
import { Color, TextVariant } from '../../theme/theme'

type Props = {
  accountData?: AccountData | null
  tokenType: TokenType
  staked?: boolean
  variant: TextVariant
  color: Color
  textAlign?: 'left' | 'center'
}

const AccountTokenCurrencyBalance = ({
  accountData,
  tokenType,
  staked = false,
  variant,
  color,
  textAlign = 'left',
}: Props) => {
  const { t } = useTranslation()
  const [balanceString, setBalanceString] = useState('')

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(accountData?.address),
    [accountData],
  )

  const balances = useAccountBalances(accountData)
  const { toCurrencyString, oraclePrice } = useBalance()

  useAsync(async () => {
    if (accountNetType !== NetTypes.MAINNET) {
      setBalanceString(t('accountView.testnetTokens'))
      return
    }

    switch (tokenType) {
      case TokenType.Hnt:
        if (staked) {
          toCurrencyString(balances?.stakedHnt).then(setBalanceString)
        } else {
          toCurrencyString(balances?.hnt).then(setBalanceString)
        }
        break
      case TokenType.Dc: {
        const balance = balances?.dc.toUsd(oraclePrice).floatBalance.toFixed(2)
        setBalanceString(
          `$${balance || '0.00'} • ${t('accountView.nonTransferable')}`,
        )
        break
      }
      case TokenType.Mobile:
        setBalanceString(t('accountView.genesis'))
        break
      case TokenType.Hst:
        setBalanceString(t('accountView.securityTokens'))
        break
      default:
        setBalanceString('-')
    }
  }, [
    accountNetType,
    balances,
    oraclePrice,
    staked,
    t,
    toCurrencyString,
    tokenType,
  ])

  return (
    <Text
      variant={variant}
      color={color}
      numberOfLines={1}
      adjustsFontSizeToFit
      textAlign={textAlign}
    >
      {balanceString}
    </Text>
  )
}

export default AccountTokenCurrencyBalance
