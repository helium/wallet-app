import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import useHaptic from '@hooks/useHaptic'
import useAlert from '@hooks/useAlert'
import QrScanner from '@components/QrScanner'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { parsePaymentLink } from '../../utils/linking'
import { solAddressIsValid } from '../../utils/accountUtils'

const AddressQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { setScannedAddress } = useAppStorage()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      // scanned qr is an address string
      if (solAddressIsValid(data)) {
        setScannedAddress(data)
        triggerNotification('success')
        navigation.goBack()
        return
      }

      // scanned qr is a payment link
      const query = parsePaymentLink(data)
      if (query?.payee && solAddressIsValid(query.payee)) {
        setScannedAddress(query.payee)
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

  return <QrScanner onBarCodeScanned={handleBarCodeScanned} />
}
export default AddressQrScanner
