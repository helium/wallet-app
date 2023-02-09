import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import useHaptic from '../../hooks/useHaptic'
import { parseBurn, parseDelagate, parsePaymentLink } from '../../utils/linking'
import useAlert from '../../hooks/useAlert'
import { HomeNavigationProp } from '../home/homeTypes'
import QrScanner from '../../components/QrScanner'

const PaymentQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      const payment = parsePaymentLink(data)
      const burn = parseBurn(data)
      const delegate = parseDelagate(data)
      if (payment) {
        triggerNotification('success')
        navigation.navigate('PaymentScreen', payment)
      } else if (burn) {
        navigation.goBack()
        navigation.replace('BurnScreen', burn)
      } else if (delegate) {
        navigation.goBack()
        navigation.replace('BurnScreen', {
          isDelegate: true,
          address: delegate.address,
          amount: '',
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
    [navigation, showOKAlert, t, triggerNotification],
  )

  return <QrScanner onBarCodeScanned={handleBarCodeScanned} />
}
export default PaymentQrScanner
