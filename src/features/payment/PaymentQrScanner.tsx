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

  // A burn replaces the form the scan came from, or pushes over the account
  // screen so close still works. Collectables has no BurnScreen, so it drops
  // its form and resets Home, giving BurnScreen a new route that reseeds.
  const showBurnScreen = useCallback(
    (params: BurnRouteParam) => {
      const state = navigation.getState()
      const below = state?.routes[state.index - 1]?.name
      if (state?.routeNames.includes('BurnScreen')) {
        navigation.goBack()
        if (below === 'PaymentScreen' || below === 'BurnScreen') {
          navigation.replace('BurnScreen', params)
        } else {
          navigation.push('BurnScreen', params)
        }
        return
      }
      if (below === 'PaymentScreen') {
        navigation.pop(2)
      } else {
        navigation.goBack()
      }
      rootNav.navigate('TabBarNavigator', {
        screen: 'Home',
        params: {
          state: {
            routes: [
              { name: 'AccountsScreen' },
              { name: 'BurnScreen', params },
            ],
          },
        },
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
