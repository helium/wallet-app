import React, { useEffect, useEffectEvent, useMemo, useState } from 'react'
import Keystone from '@assets/images/keystoneLogo.svg'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { useTranslation } from 'react-i18next'
import KeystoneSDK from '@keystonehq/keystone-sdk'
import useAlert from '@hooks/useAlert'
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera'
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import EventEmitter from 'events'

import { CloseButton } from '@ui/CloseButton'
import { useHitSlop } from '@theme/themeHooks'
import { AnimatedQrCode } from '../components/StaticQrCode'
import ProgressBar from '../components/ProgressBar'
import { CameraScannerLayout } from '../components/CameraScannerLayout'
import { KeystoneSolSignRequest } from '../types/keystoneSolanaTxType'
import { createSignatureScanner } from './signatureScanner'

const SafeArea = withUniwind(SafeAreaView)

type Props = {
  progress: number
  onBarCodeScanned: (data: string) => void
}
const DaynamicQrScanner = ({ onBarCodeScanned, progress }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()
  useEffect(() => {
    void Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  const askToOpenSettings = useEffectEvent(async () => {
    if (hasPermission !== false) return

    const decision = await showOKCancelAlert({
      title: t('qrScanner.deniedAlert.title'),
      message: t('qrScanner.deniedAlert.message'),
      ok: t('qrScanner.deniedAlert.ok'),
    })

    if (decision) {
      if (Platform.OS === 'ios') {
        void Linking.openURL('app-settings:')
      } else {
        void Linking.openSettings()
      }
    }
  })
  useEffect(() => {
    askToOpenSettings().catch((e) => console.error(e))
  }, [hasPermission, showOKCancelAlert])

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    onBarCodeScanned(result.data)
  }

  return (
    <SafeArea className="flex-1" edges={['top']}>
      {hasPermission === true && (
        <>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            style={StyleSheet.absoluteFill}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ratio="16:9"
          />
          <CameraScannerLayout />
        </>
      )}
      {progress > 0 && (
        <View className="absolute bottom-[25%] w-[70%] self-center">
          <ProgressBar progress={progress} />
        </View>
      )}

      <View className="absolute bottom-[15%] w-[95%] self-center px-2">
        <Text size="base" className="mt-8 text-center font-medium">
          {t('keystone.payment.scanTxQrcodeScreenSubtitle3')}
        </Text>
      </View>
    </SafeArea>
  )
}
const ScanTxQrcodeScreen = ({
  eventEmitter,
  solSignRequest,
}: {
  eventEmitter: EventEmitter
  solSignRequest: KeystoneSolSignRequest
}) => {
  const { t } = useTranslation()
  const keystoneSDK = useMemo(() => new KeystoneSDK(), [])
  const scanner = useMemo(
    () => createSignatureScanner(keystoneSDK),
    [keystoneSDK],
  )
  const solSignRequestUr = solSignRequest?.requestId
    ? keystoneSDK.sol.generateSignRequest(solSignRequest)
    : undefined
  const [openQrCodeScanner, setOpenQrCodeScanner] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [isUnexpectedQrCode, setIsUnexpectedQrCode] = useState(false)
  const handleGetSignature = () => {
    setIsUnexpectedQrCode(false)
    setOpenQrCodeScanner(true)
  }

  // A half-scanned signature from a previous request must not carry over
  const [prevRequestId, setPrevRequestId] = useState(solSignRequest?.requestId)
  if (prevRequestId !== solSignRequest?.requestId) {
    setPrevRequestId(solSignRequest?.requestId)
    setProgress(0)
    setIsUnexpectedQrCode(false)
  }
  useEffect(() => {
    scanner.reset()
  }, [scanner, solSignRequest?.requestId])

  const handleBarCodeScanned = (qrString: string) => {
    const result = scanner.receive(qrString, solSignRequest.requestId)
    if (result.status === 'progress') {
      setProgress(result.progress)
    } else if (result.status === 'complete') {
      setOpenQrCodeScanner(false)
      eventEmitter.emit(
        `keystoneSignature_${solSignRequest.requestId}`,
        result.signature.signature,
      )
      setProgress(0)
    } else {
      setOpenQrCodeScanner(false)
      setProgress(0)
      setIsUnexpectedQrCode(true)
    }
  }
  // The camera keeps scanning until it unmounts, so alert once per bad scan
  const alertUnexpectedQrCode = useEffectEvent(() => {
    Alert.alert(
      t('keystone.connectKeystoneStart.unexpectedQrCodeTitle'),
      t('keystone.connectKeystoneStart.unexpectedQrCodeContent'),
    )
  })
  useEffect(() => {
    if (isUnexpectedQrCode) {
      alertUnexpectedQrCode()
    }
  }, [isUnexpectedQrCode])

  const hitSlop = useHitSlop('l')
  return (
    <SafeArea className="flex-1" edges={['bottom']}>
      {openQrCodeScanner && (
        <DaynamicQrScanner
          onBarCodeScanned={handleBarCodeScanned}
          progress={progress}
        />
      )}
      <View className="absolute mt-6 w-full flex-row items-center justify-between px-6">
        <View className="px-7" />
        {openQrCodeScanner && (
          <Text size="xl" className="text-center">
            {t('keystone.scanQrCode')}
          </Text>
        )}
        <CloseButton
          className="-me-7 px-7"
          hitSlop={hitSlop}
          onPress={() => {
            eventEmitter.emit('closeKeystoneSignatureModal', '')
          }}
        />
      </View>
      {!openQrCodeScanner && (
        <View className="mt-8 flex-1 items-center justify-between p-6">
          <View className="flex-1 justify-center">
            <View className="items-center py-6">
              <Keystone width={48} height={48} />
              <Text size="4xl" className="my-5 text-center">
                {t('keystone.payment.scanTxQrcodeScreenTitle')}
              </Text>
              <Text size="xl" className="text-center font-medium">
                {t('keystone.payment.scanTxQrcodeScreenSubtitle1')}
              </Text>
              {/* show the sol sign request qrcode  */}
              {solSignRequestUr && (
                <View className="my-6">
                  <AnimatedQrCode
                    size={240}
                    qrCodeType={solSignRequestUr.type}
                    cborData={solSignRequestUr.cbor.toString('hex')}
                  />
                </View>
              )}
              <Text size="xl" className="text-center font-medium">
                {t('keystone.payment.scanTxQrcodeScreenSubtitle2')}
              </Text>
            </View>
          </View>
          <Button
            variant="cta"
            size="lg"
            className="mb-6 w-full"
            onPress={handleGetSignature}
          >
            {t('keystone.payment.getSignature')}
          </Button>
        </View>
      )}
    </SafeArea>
  )
}

export default ScanTxQrcodeScreen
