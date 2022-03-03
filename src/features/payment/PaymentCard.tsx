import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import BackgroundFill from '../../components/BackgroundFill'
import Box from '../../components/Box'
import SubmitButton from '../../components/SubmitButton'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import animateTransition from '../../utils/animateTransition'
import { Payment } from './PaymentItem'
import PaymentSummary from './PaymentSummary'

type Props = {
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  onSubmit: () => void
  disabled: boolean
  insufficientFunds: boolean
  payments: Payment[]
}

const PaymentCard = ({
  totalBalance,
  feeTokenBalance,
  onSubmit,
  disabled,
  payments,
  insufficientFunds,
}: Props) => {
  const { t } = useTranslation()
  const [payEnabled, setPayEnabled] = useState(false)
  const [height, setHeight] = useState(0)

  const handlePayPressed = useCallback(() => {
    animateTransition('PaymentCard.payEnabled')
    setPayEnabled(true)
  }, [])

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (height > 0) return
      setHeight(e.nativeEvent.layout.height)
    },
    [height],
  )

  return (
    <Box
      borderTopLeftRadius="xl"
      borderTopRightRadius="xl"
      padding="l"
      height={height || undefined}
      onLayout={handleLayout}
      overflow="hidden"
    >
      <BackgroundFill backgroundColor="secondary" opacity={0.4} />

      <PaymentSummary
        totalBalance={totalBalance}
        feeTokenBalance={feeTokenBalance}
        disabled={disabled}
        payments={payments}
        insufficientFunds={insufficientFunds}
      />
      <Box marginTop="xxl">
        {!payEnabled ? (
          <>
            <Box flexDirection="row" marginTop="l">
              <TouchableOpacityBox
                flex={1}
                minHeight={66}
                justifyContent="center"
                marginEnd="m"
                borderRadius="round"
                overflow="hidden"
                backgroundColor="secondaryIcon"
              >
                <Text
                  variant="subtitle1"
                  textAlign="center"
                  color="primaryText"
                >
                  {t('generic.cancel')}
                </Text>
              </TouchableOpacityBox>
              <TouchableOpacityBox
                flex={1}
                minHeight={66}
                backgroundColor={disabled ? 'secondary' : 'surfaceContrast'}
                justifyContent="center"
                alignItems="center"
                onPress={handlePayPressed}
                disabled={disabled}
                borderRadius="round"
                flexDirection="row"
              >
                <Text
                  marginLeft="s"
                  variant="subtitle1"
                  textAlign="center"
                  color={disabled ? 'surface' : 'secondary'}
                >
                  {t('payment.pay')}
                </Text>
              </TouchableOpacityBox>
            </Box>
          </>
        ) : (
          <SubmitButton
            marginTop="l"
            title={t('payment.sendButton', {
              ticker: totalBalance?.type.ticker,
            })}
            onSubmit={onSubmit}
          />
        )}
      </Box>
    </Box>
  )
}

export default memo(PaymentCard)
