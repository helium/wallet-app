import React, { memo, useEffect, useState } from 'react'
import { addMinutes } from 'date-fns'
import { BoxProps } from '@shopify/restyle'
import { GestureResponderEvent } from 'react-native'
import Text from '@components/Text'
import FadeInOut from '@components/FadeInOut'
import useLayoutHeight from '@hooks/useLayoutHeight'
import Box from '@components/Box'
import { Theme } from '@theme/theme'
import TokenPricesTicker from '@components/TokenPricesTicker'
import CopyAddressPill from '@components/CopyAddressPill'
import CurrencyFormatter from 'react-native-currency-format'
import { useBalance } from '../../utils/Balance'
import { useAppStorage } from '../../storage/AppStorageProvider'
import AccountActionBar from './AccountActionBar'
import DateModule from '../../utils/DateModule'
import { AccountBalance } from '../../types/balance'

type Props = {
  selectedBalance?: AccountBalance
  onTouchStart?: (event: GestureResponderEvent) => void
} & BoxProps<Theme>

const AccountView = ({ selectedBalance, ...boxProps }: Props) => {
  const [selectedDate, setSelectedDate] = useState('')
  const [balanceString, setBalanceString] = useState('')
  const { totalValue } = useBalance()
  const { currency, l1Network } = useAppStorage()
  const [actionBarHeight, setActionBarHeight] = useLayoutHeight()

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
    if (selectedBalance) {
      CurrencyFormatter.format(selectedBalance.balance, currency).then(
        setBalanceString,
      )
    } else {
      setBalanceString(totalValue || '')
    }
  }, [currency, selectedBalance, totalValue])

  return (
    <Box flexDirection="column" alignItems="center" {...boxProps}>
      <Box>
        <TokenPricesTicker marginVertical="m" />
      </Box>
      <Box alignItems="center" flex={1} justifyContent="center">
        <CopyAddressPill />

        {!balanceString && (
          <Text
            maxFontSizeMultiplier={1.1}
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
              maxFontSizeMultiplier={1.1}
              variant="h0"
              color="primaryText"
              numberOfLines={1}
              adjustsFontSizeToFit
              textAlign="center"
              marginBottom="m"
            >
              {balanceString}
            </Text>
          </FadeInOut>
        )}
        {!selectedBalance && (
          <FadeInOut>
            <AccountActionBar
              compact
              hasSwaps={l1Network === 'solana'}
              hasBottomTitle
              onLayout={setActionBarHeight}
            />
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
              >
                {selectedDate}
              </Text>
            </Box>
          </FadeInOut>
        )}
      </Box>
    </Box>
  )
}

export default memo(AccountView)
