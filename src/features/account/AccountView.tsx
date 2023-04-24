import React, { memo, useEffect, useMemo, useState } from 'react'
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
import CopyAddressPill from '@components/CopyAddressPill'
import { AccountBalance } from '../../generated/graphql'
import { useBalance } from '../../utils/Balance'
import { useAppStorage } from '../../storage/AppStorageProvider'
import supportedCurrencies from '../../utils/supportedCurrencies'
import AccountActionBar from './AccountActionBar'
import DateModule from '../../utils/DateModule'

type Props = {
  selectedBalance?: AccountBalance
  onTouchStart?: (event: GestureResponderEvent) => void
  onCurrencySelectorPress?: () => void
} & BoxProps<Theme>

const AccountView = ({
  selectedBalance,
  onCurrencySelectorPress,
  ...boxProps
}: Props) => {
  const [selectedDate, setSelectedDate] = useState('')
  const spacing = useSpacing()

  const { totalValue } = useBalance()
  const { currency, l1Network } = useAppStorage()
  const [actionBarHeight, setActionBarHeight] = useLayoutHeight()

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

  return (
    <Box flexDirection="column" alignItems="center" {...boxProps}>
      <Box>
        <TokenPricesTicker marginVertical="m" />
      </Box>
      <Box alignItems="center" flex={1} justifyContent="center">
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
        {!totalValue && (
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
        {!!totalValue && (
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
              {totalValue}
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
        <CopyAddressPill marginTop="m" />
      </Box>
    </Box>
  )
}

export default memo(AccountView)
