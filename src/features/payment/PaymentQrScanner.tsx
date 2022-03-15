import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import useHaptic from '../../utils/useHaptic'
import { parsePaymentLink } from '../../utils/linking'
import useAlert from '../../utils/useAlert'
import { HomeNavigationProp } from '../home/homeTypes'
import QrScanner from '../../components/QrScanner'

const PaymentQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      const query = parsePaymentLink(data)
      if (query) {
        triggerNotification('success')
        navigation.navigate('PaymentScreen', query)
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
