import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import useHaptic from '@hooks/useHaptic'
import useAlert from '@hooks/useAlert'
import { QrScanner } from '@ui/QrScanner'
import { parseBurn, parseDelegate, parsePaymentLink } from '../../utils/linking'
import { BurnRouteParam, HomeNavigationProp } from '../home/homeTypes'
import { RootNavigationProp } from '../../navigation/rootTypes'

const PaymentQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()

  // The Collectables stack hosts this scanner too but has no BurnScreen, so a
  // burn from there opens the one on the Home stack.
  const showBurnScreen = useCallback(
    (params: BurnRouteParam) => {
      navigation.goBack()
      if (navigation.getState()?.routeNames.includes('BurnScreen')) {
        navigation.replace('BurnScreen', params)
        return
      }
      rootNav.navigate('TabBarNavigator', {
        screen: 'Home',
        initial: false,
        params: { screen: 'BurnScreen', params, initial: false },
      })
    },
    [navigation, rootNav],
  )

  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      const payment = parsePaymentLink(data)
      const burn = parseBurn(data)
      const delegate = parseDelegate(data)
      if (payment) {
        triggerNotification('success')
        navigation.navigate('PaymentScreen', payment, { pop: true })
      } else if (burn) {
        showBurnScreen(burn)
      } else if (delegate) {
        showBurnScreen({
          isDelegate: true,
          address: delegate.address,
          amount: delegate.amount,
          memo: delegate.memo,
          mint: delegate.mint,
        })
      } else {
        await showOKAlert({
          title: t('payment.qrScanFail.title'),
          message: t('payment.qrScanFail.message'),
        })
        triggerNotification('error')
        navigation.goBack()
      }
    },
    [navigation, showBurnScreen, showOKAlert, t, triggerNotification],
  )

  return (
    <QrScanner
      onBarCodeScanned={(data) =>
        void handleBarCodeScanned(data).catch(console.error)
      }
    />
  )
}
export default PaymentQrScanner
