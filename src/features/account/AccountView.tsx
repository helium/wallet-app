import useLayoutHeight from '@hooks/useLayoutHeight'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { useLanguage } from '@utils/i18n'
import React from 'react'
import { GestureResponderEvent, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { AccountBalance } from '../../types/balance'
import { numberFormat, useBalance } from '../../utils/Balance'
import AccountActionBar from './AccountActionBar'
import CopyAddressPill from './CopyAddressPill'
import { formatBalanceDate } from './logic/formatBalanceDate'

type Props = {
  selectedBalance?: AccountBalance
  onTouchStart?: (event: GestureResponderEvent) => void
  className?: string
}

const AccountView = ({ selectedBalance, onTouchStart, className }: Props) => {
  const { formattedTotal } = useBalance()
  const { currency } = useAppStorage()
  const [actionBarHeight, setActionBarHeight] = useLayoutHeight()
  const { language } = useLanguage()

  const selectedDate = selectedBalance
    ? formatBalanceDate(selectedBalance.date)
    : ''

  const balanceString = selectedBalance
    ? numberFormat(language, currency, Number(selectedBalance.balance))
    : formattedTotal || ''

  return (
    <View
      className={twMerge('flex-col items-center', className)}
      onTouchStart={onTouchStart}
    >
      <View className="w-full flex-1 items-center justify-center">
        <CopyAddressPill />

        {!balanceString && (
          <Text
            size="4xl"
            maxFontSizeMultiplier={1.1}
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-center"
          >
            {' '}
          </Text>
        )}
        {!!balanceString && (
          <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
            <Text
              testID="AccountView.Balance"
              size="4xl"
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              adjustsFontSizeToFit
              className="mb-4 text-center"
            >
              {balanceString}
            </Text>
          </Animated.View>
        )}
        {!selectedBalance && (
          <Animated.View
            entering={FADE_IN}
            exiting={FADE_OUT}
            className="w-full items-center justify-center"
          >
            <AccountActionBar
              compact
              hasSwaps
              hasBottomTitle
              onLayout={setActionBarHeight}
            />
          </Animated.View>
        )}
        {selectedBalance && (
          <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
            <View style={{ minHeight: actionBarHeight }}>
              <Text
                size="xs"
                numberOfLines={1}
                adjustsFontSizeToFit
                className="ml-1 text-muted-foreground"
              >
                {selectedDate}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  )
}

export default AccountView
