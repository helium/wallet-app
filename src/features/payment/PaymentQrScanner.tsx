import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BarCodeScanningResult, Camera } from 'expo-camera'
import { StyleSheet } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import useHaptic from '../../utils/useHaptic'
import { parsePaymentLink } from '../../utils/linking'
import useAlert from '../../utils/useAlert'
import { HomeNavigationProp } from '../home/homeTypes'

const PaymentQrScanner = () => {
  const [hasPermission, setHasPermission] = useState(false)
  const [scanned, setScanned] = useState(false)
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  const handleBarCodeScanned = useCallback(
    async (result: BarCodeScanningResult) => {
      if (scanned) return

      setScanned(true)

      const query = parsePaymentLink(result.data)
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
    [navigation, scanned, showOKAlert, t, triggerNotification],
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
    <Camera
      onBarCodeScanned={handleBarCodeScanned}
      barCodeScannerSettings={barCodeScannerSettings}
      style={StyleSheet.absoluteFillObject}
    />
  )
}
export default PaymentQrScanner
