import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Address } from '@helium/crypto-react-native'
import useHaptic from '../../utils/useHaptic'
import useAlert from '../../utils/useAlert'
import { HomeNavigationProp } from '../home/homeTypes'
import BackScreen from '../../components/BackScreen'
import { useAppStorage } from '../../storage/AppStorageProvider'
import QrScanner from '../../components/QrScanner'

const PaymentQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { setScannedAddress } = useAppStorage()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

  const handleBarCodeScanned = useCallback(
    async (address: string) => {
      if (Address.isValid(address)) {
        setScannedAddress(address)
        triggerNotification('success')
        navigation.goBack()
      } else {
        triggerNotification('error')
        await showOKAlert({
          title: t('addressBook.qrScanFail.title'),
          message: t('addressBook.qrScanFail.message'),
        })
        navigation.goBack()
      }
    },
    [navigation, setScannedAddress, showOKAlert, t, triggerNotification],
  )

  return (
    <BackScreen>
      <QrScanner onBarCodeScanned={handleBarCodeScanned} />
    </BackScreen>
  )
}
export default PaymentQrScanner
