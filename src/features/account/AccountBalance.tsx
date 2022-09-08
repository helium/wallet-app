import React, { useEffect, useMemo, useState } from 'react'
import { NetTypes } from '@helium/address'
import * as AccountUtils from '../../utils/accountUtils'
import { AccountData } from '../../generated/graphql'
import Text from '../../components/Text'
import { useAccountBalances, useBalance } from '../../utils/Balance'

type Props = {
  accountData?: AccountData | null
}

const AccountBalance = ({ accountData }: Props) => {
  const [balanceString, setBalanceString] = useState('')

  const balances = useAccountBalances(accountData)
  const { toCurrencyString } = useBalance()

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(accountData?.address),
    [accountData],
  )

  useEffect(() => {
    if (accountNetType !== NetTypes.MAINNET) {
      setBalanceString('')
      return
    }

    toCurrencyString(balances?.hnt?.plus(balances.stakedHnt)).then(
      setBalanceString,
    )
  }, [accountNetType, balances, toCurrencyString])

  return (
    <Text
      variant="h0"
      color="primaryText"
      numberOfLines={1}
      adjustsFontSizeToFit
      textAlign="center"
    >
      {balanceString || ' '}
    </Text>
  )
}

export default AccountBalance
