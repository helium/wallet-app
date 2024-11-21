import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import useHaptic from '@hooks/useHaptic'
import useAlert from '@hooks/useAlert'
import QrScanner from '@components/QrScanner'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage'
import { SendNavigationProp } from '@services/WalletService/pages/SendPage'
import { parseBurn, parseDelegate, parsePaymentLink } from '../../utils/linking'

const PaymentQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<WalletNavigationProp>()
  const sendNav = useNavigation<SendNavigationProp>()

  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      const payment = parsePaymentLink(data)
      const burn = parseBurn(data)
      const delegate = parseDelegate(data)
      if (payment) {
        triggerNotification('success')
        sendNav.navigate('PaymentScreen', payment)
      } else if (burn) {
        navigation.goBack()
        navigation.replace('BurnScreen', burn)
      } else if (delegate) {
        navigation.goBack()
        navigation.replace('BurnScreen', {
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
    [navigation, showOKAlert, t, triggerNotification, sendNav],
  )

  return <QrScanner onBarCodeScanned={handleBarCodeScanned} />
}
export default PaymentQrScanner
