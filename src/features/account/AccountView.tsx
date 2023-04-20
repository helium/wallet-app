import React, { memo, useEffect, useMemo, useState } from 'react'
import { NetTypes } from '@helium/address'
import CurrencyFormatter from 'react-native-currency-format'
import { addMinutes } from 'date-fns'
import { BoxProps } from '@shopify/restyle'
import { GestureResponderEvent, ViewStyle } from 'react-native'
import CarotDown from '@assets/images/triangleDown.svg'
import ButtonPressAnimation from '@components/ButtonPressAnimation'
import Text from '@components/Text'
import FadeInOut from '@components/FadeInOut'
import useLayoutHeight from '@hooks/useLayoutHeight'
import Box from '@components/Box'
import { Theme } from '@theme/theme'
import TokenPricesTicker from '@components/TokenPricesTicker'
import { useSpacing } from '@theme/themeHooks'
import * as AccountUtils from '../../utils/accountUtils'
import { AccountBalance, AccountData } from '../../generated/graphql'
import { useBalance } from '../../utils/Balance'
import { useAppStorage } from '../../storage/AppStorageProvider'
import supportedCurrencies from '../../utils/supportedCurrencies'
import AccountActionBar from './AccountActionBar'
import DateModule from '../../utils/DateModule'

type Props = {
  accountData?: AccountData | null
  selectedBalance?: AccountBalance
  onTouchStart?: (event: GestureResponderEvent) => void
  onCurrencySelectorPress?: () => void
} & BoxProps<Theme>

const AccountView = ({
  accountData,
  selectedBalance,
  onCurrencySelectorPress,
  ...boxProps
}: Props) => {
  const [balanceString, setBalanceString] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const spacing = useSpacing()

  const { totalBalance, networkBalance, networkStakedBalance } = useBalance()
  const { currency, l1Network } = useAppStorage()
  const [actionBarHeight, setActionBarHeight] = useLayoutHeight()

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(accountData?.address),
    [accountData],
  )

  const currencySelectorStyles = useMemo(() => {
    return {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.m,
    } as ViewStyle
  }, [spacing])

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
      setBalanceString('Testnet')
      return
    }

    if (selectedBalance) {
      CurrencyFormatter.format(selectedBalance.balance, currency).then(
        setBalanceString,
      )
    } else {
      totalBalance().then(setBalanceString)
    }
  }, [
    accountNetType,
    currency,
    networkBalance,
    networkStakedBalance,
    selectedBalance,
    totalBalance,
  ])

  return (
    <Box flexDirection="column" alignItems="center" {...boxProps}>
      <Box position="absolute" top={0}>
        <TokenPricesTicker marginTop="m" />
      </Box>
      <ButtonPressAnimation
        backgroundColor="surfaceSecondary"
        borderRadius="round"
        marginBottom="l"
        onPress={onCurrencySelectorPress}
        pressableStyles={currencySelectorStyles}
      >
        <Text
          variant="body2"
          color="secondaryText"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          textAlign="center"
          marginEnd="s"
        >
          {supportedCurrencies[currency]}
        </Text>
        <Box marginTop="xxs">
          <CarotDown />
        </Box>
      </ButtonPressAnimation>
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
  )
}

export default memo(AccountView)
