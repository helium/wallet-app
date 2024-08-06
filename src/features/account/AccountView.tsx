import Box from '@components/Box'
import CopyAddressPill from '@components/CopyAddressPill'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { useLanguage } from '@utils/i18n'
import { addMinutes } from 'date-fns'
import React, { memo, useEffect, useState } from 'react'
import { GestureResponderEvent } from 'react-native'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { AccountBalance } from '../../types/balance'
import { numberFormat, useBalance } from '../../utils/Balance'
import DateModule from '../../utils/DateModule'
import AccountActionBar from './AccountActionBar'

type Props = {
  selectedBalance?: AccountBalance
  onTouchStart?: (event: GestureResponderEvent) => void
} & BoxProps<Theme>

const AccountView = ({ selectedBalance, ...boxProps }: Props) => {
  const [selectedDate, setSelectedDate] = useState('')
  const [balanceString, setBalanceString] = useState('')
  const { formattedTotal } = useBalance()
  const { currency } = useAppStorage()
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

  const { language } = useLanguage()

  useEffect(() => {
    if (selectedBalance) {
      setBalanceString(
        numberFormat(language, currency, Number(selectedBalance.balance)),
      )
    } else {
      setBalanceString(formattedTotal || '')
    }
  }, [language, currency, selectedBalance, formattedTotal])

  return (
    <Box flexDirection="column" alignItems="center" {...boxProps}>
      <Box alignItems="center" flex={1} justifyContent="center" width="100%">
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
          <FadeInOut
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AccountActionBar
              compact
              hasSwaps
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
