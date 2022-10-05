import React, { useEffect, useMemo, useState } from 'react'
import { NetTypes } from '@helium/address'
import CurrencyFormatter from 'react-native-currency-format'
import { addMinutes } from 'date-fns'
import * as AccountUtils from '../../utils/accountUtils'
import { AccountBalance, AccountData } from '../../generated/graphql'
import Text from '../../components/Text'
import { useAccountBalances, useBalance } from '../../utils/Balance'
import FadeInOut from '../../components/FadeInOut'
import { useAppStorage } from '../../storage/AppStorageProvider'
import supportedCurrencies from '../../utils/supportedCurrencies'
import AccountActionBar from './AccountActionBar'
import useLayoutHeight from '../../utils/useLayoutHeight'
import Box from '../../components/Box'
import DateModule from '../../utils/DateModule'

type Props = {
  accountData?: AccountData | null
  hntPrice?: number
  selectedBalance?: AccountBalance
}

const AccountView = ({ accountData, hntPrice, selectedBalance }: Props) => {
  const [balanceString, setBalanceString] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const balances = useAccountBalances(accountData)
  const { toCurrencyString } = useBalance()
  const { currency } = useAppStorage()
  const [formattedHntPrice, setFormattedHntPrice] = useState('')
  const [actionBarHeight, setActionBarHeight] = useLayoutHeight()

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(accountData?.address),
    [accountData],
  )

  useEffect(() => {
    if (!selectedBalance) {
      setSelectedDate('')
      return
    }
    const date = new Date(selectedBalance.date)
    const utc = addMinutes(date, date.getTimezoneOffset())
    DateModule.formatDate(utc.toISOString(), 'dd MMMM yyyy').then(
      setSelectedDate,
    )
  }, [selectedBalance])

  useEffect(() => {
    if (accountNetType !== NetTypes.MAINNET) {
      setFormattedHntPrice('Testnet')
      return
    }

    if (!hntPrice && !selectedBalance) return

    let price = hntPrice

    if (selectedBalance) {
      price = selectedBalance.hntPrice
    }

    CurrencyFormatter.format(price || 0, currency).then((p) =>
      setFormattedHntPrice(`1 HNT = ${p}`),
    )
  }, [accountNetType, currency, hntPrice, selectedBalance])

  useEffect(() => {
    if (accountNetType !== NetTypes.MAINNET) {
      setBalanceString('Testnet')
      return
    }

    if (selectedBalance) {
      CurrencyFormatter.format(selectedBalance.balance, currency).then(
        setBalanceString,
      )
    } else if (hntPrice) {
      toCurrencyString(balances?.hnt?.plus(balances.stakedHnt)).then(
        setBalanceString,
      )
    } else {
      setBalanceString('')
    }
  }, [
    accountNetType,
    balances,
    currency,
    hntPrice,
    selectedBalance,
    toCurrencyString,
  ])

  return (
    <Box flexDirection="column" alignItems="center">
      <Text
        variant="body1"
        color="secondaryText"
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.3}
        textAlign="center"
        marginBottom="s"
      >
        {supportedCurrencies[currency]}
      </Text>
      {!balanceString && (
        <Text
          maxFontSizeMultiplier={1.3}
          variant="h0"
          color="primaryText"
          numberOfLines={1}
          adjustsFontSizeToFit
          textAlign="center"
        >
          {' '}
        </Text>
      )}
      {!!balanceString && (
        <FadeInOut>
          <Text
            maxFontSizeMultiplier={1.3}
            variant="h0"
            color="primaryText"
            numberOfLines={1}
            adjustsFontSizeToFit
            textAlign="center"
          >
            {balanceString}
          </Text>
        </FadeInOut>
      )}
      <Text
        variant="body3"
        textAlign="center"
        marginTop="s"
        marginBottom="m"
        color="secondaryText"
      >
        {formattedHntPrice}
      </Text>
      {!selectedBalance && (
        <FadeInOut>
          <AccountActionBar onLayout={setActionBarHeight} />
        </FadeInOut>
      )}
      {selectedBalance && (
        <FadeInOut>
          <Box minHeight={actionBarHeight}>
            <Text
              variant="body3"
              color="secondaryText"
              marginLeft="xs"
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.3}
            >
              {selectedDate}
            </Text>
          </Box>
        </FadeInOut>
      )}
    </Box>
  )
}

export default AccountView
