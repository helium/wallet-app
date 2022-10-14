import React, { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import * as AccountUtils from '../../utils/accountUtils'
import { useBalance } from '../../utils/Balance'
import { TokenType } from '../../generated/graphql'
import Text, { TextProps } from '../../components/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

type Props = {
  tokenType: TokenType
  staked?: boolean
} & TextProps

const AccountTokenCurrencyBalance = ({
  tokenType,
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
    helium: { dcBalance, networkBalance, networkStakedBalance },
  } = useBalance()

  useAsync(async () => {
    if (accountNetType !== NetTypes.MAINNET) {
      setBalanceString(t('accountView.testnetTokens'))
      return
    }

    switch (tokenType) {
      case TokenType.Hnt:
        if (staked) {
          toCurrencyString(networkStakedBalance).then(setBalanceString)
        } else {
          toCurrencyString(networkBalance).then(setBalanceString)
        }
        break
      case TokenType.Dc: {
        const balance = dcBalance?.toUsd(oraclePrice).floatBalance.toFixed(2)
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
  }, [accountNetType, oraclePrice, staked, t, toCurrencyString, tokenType])

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
