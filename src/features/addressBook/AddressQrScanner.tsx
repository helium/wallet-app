import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BarCodeScanningResult, Camera } from 'expo-camera'
import { StyleSheet } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Address } from '@helium/crypto-react-native'
import Box from '../../components/Box'
import useHaptic from '../../utils/useHaptic'
import useAlert from '../../utils/useAlert'
import { HomeNavigationProp } from '../home/homeTypes'
import BackScreen from '../../components/BackScreen'
import { useAppStorage } from '../../storage/AppStorageProvider'

const PaymentQrScanner = () => {
  const [hasPermission, setHasPermission] = useState(false)
  const [scanned, setScanned] = useState(false)
  const { triggerNotification } = useHaptic()
  const { setScannedAddress } = useAppStorage()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  const handleBarCodeScanned = useCallback(
    async ({ data: address }: BarCodeScanningResult) => {
      if (scanned) return
      setScanned(true)

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
    [
      navigation,
      scanned,
      setScannedAddress,
      showOKAlert,
      t,
      triggerNotification,
    ],
  )

  const barCodeScannerSettings = useMemo(
    () => ({
      barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
    }),
    [],
  )

  if (!hasPermission) {
    return <Box />
  }

  return (
    <BackScreen>
      <Camera
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={barCodeScannerSettings}
        style={StyleSheet.absoluteFillObject}
      />
    </BackScreen>
  )
}
export default PaymentQrScanner
