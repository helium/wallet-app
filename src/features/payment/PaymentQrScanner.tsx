import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BarCodeScanningResult, Camera } from 'expo-camera'
import { Linking, StyleSheet } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { Address } from '@helium/crypto-react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import useHaptic from '../../utils/useHaptic'
import { makePayRequestLink } from '../../utils/linking'
import useAlert from '../../utils/useAlert'

const PaymentQrScanner = () => {
  const [hasPermission, setHasPermission] = useState(false)
  const [scanned, setScanned] = useState(false)
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation()

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) =>
      setHasPermission(status === 'granted'),
    )
  }, [])

  const handleBarCodeScanned = useCallback(
    async (result: BarCodeScanningResult) => {
      if (scanned) return

      setScanned(true)

      let canOpen = false
      try {
        canOpen = await Linking.canOpenURL(result.data)
      } catch (e) {}

      if (canOpen) {
        Linking.openURL(result.data)
        triggerNotification('success')
      } else if (Address.isValid(result.data)) {
        const url = makePayRequestLink({ payee: result.data })
        Linking.openURL(url)
      } else {
        await showOKAlert({
          title: t('payment.qrScanFail.title'),
          message: t('payment.qrScanFail.message'),
        })
        navigation.goBack()
      }
    },
    [navigation, scanned, showOKAlert, t, triggerNotification],
  )

  const barCodeScannerSettings = useMemo(
    () => ({
      barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
    }),
    [],
  )

  if (!hasPermission === null) {
    return <Box />
  }
  return (
    <Camera
      onBarCodeScanned={handleBarCodeScanned}
      barCodeScannerSettings={barCodeScannerSettings}
      style={StyleSheet.absoluteFillObject}
    />
  )
}
export default PaymentQrScanner
