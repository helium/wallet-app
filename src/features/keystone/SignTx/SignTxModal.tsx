import SafeAreaBox from '@components/SafeAreaBox'
import React, { useEffect, useMemo, useState } from 'react'
import Keystone from '@assets/images/keystoneLogo.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import { useTranslation } from 'react-i18next'
import KeystoneSDK, { UR, URDecoder } from '@keystonehq/keystone-sdk'
import { AnimatedQrCode } from '@components/StaticQrCode'
import useAlert from '@hooks/useAlert'
import { BarCodeScanningResult, Camera } from 'expo-camera'
import { Linking, Platform, StyleSheet } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import ProgressBar from '@components/ProgressBar'
import { useAsync } from 'react-async-hook'
import EventEmitter from 'events'

import CloseButton from '@components/CloseButton'
import { useHitSlop } from '@theme/themeHooks'
import { CameraScannerLayout } from '../../../components/CameraScannerLayout'
import { KeystoneSolSignRequest } from '../types/keystoneSolanaTxType'

type Props = {
  progress: number
  onBarCodeScanned: (data: string) => void
}
const DaynamicQrScanner = ({ onBarCodeScanned, progress }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()
  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  useAsync(async () => {
    if (hasPermission !== false) return

    const decision = await showOKCancelAlert({
      title: t('qrScanner.deniedAlert.title'),
      message: t('qrScanner.deniedAlert.message'),
      ok: t('qrScanner.deniedAlert.ok'),
    })

    if (decision) {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:')
      } else {
        Linking.openSettings()
      }
    }
  }, [hasPermission, showOKCancelAlert])

  const barCodeScannerSettings = useMemo(
    () => ({
      barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
    }),
    [],
  )
  const handleBarCodeScanned = (result: BarCodeScanningResult) => {
    onBarCodeScanned(result.data)
  }

  return (
    <SafeAreaBox flex={1} edges={['top']}>
      <Camera
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={barCodeScannerSettings}
        style={StyleSheet.absoluteFillObject}
        ratio="16:9"
      />
      <CameraScannerLayout />
      {progress > 0 && (
        <Box position="absolute" bottom="25%" width="70%" alignSelf="center">
          <ProgressBar progress={progress} />
        </Box>
      )}

      <Box
        position="absolute"
        bottom="15%"
        width="95%"
        alignSelf="center"
        paddingHorizontal="s"
      >
        <Text variant="subtitle3" marginTop="xl" textAlign="center">
          {t('keystone.payment.scanTxQrcodeScreenSubtitle3')}
        </Text>
      </Box>
    </SafeAreaBox>
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
  const decoder = useMemo(() => new URDecoder(), [])
  const solSignRequestUr = useMemo(() => {
    return keystoneSDK.sol.generateSignRequest(solSignRequest)
  }, [keystoneSDK, solSignRequest])
  const [openQrCodeScanner, setOpenQrCodeScanner] = useState(false)
  const [progress, setProgress] = useState<number>(0)

  const handleGetSignature = () => {
    setOpenQrCodeScanner(true)
  }

  const handleBarCodeScanned = (qrString: string) => {
    decoder.receivePart(qrString.toLowerCase())
    setProgress(Number((decoder.getProgress() * 100).toFixed(0)))
    if (decoder.isComplete()) {
      const ur = decoder.resultUR()
      const buffer = Buffer.from(ur.cbor.toString('hex'), 'hex')
      const signature = keystoneSDK.sol.parseSignature(new UR(buffer, ur.type))
      eventEmitter.emit('keystoneSignature', signature.signature)
      setProgress(100)
    }
  }
  const hitSlop = useHitSlop('l')
  return (
    <SafeAreaBox flex={1} edges={['bottom']}>
      {openQrCodeScanner && (
        <DaynamicQrScanner
          onBarCodeScanned={handleBarCodeScanned}
          progress={progress}
        />
      )}
      <Box
        flexDirection="row"
        width="100%"
        paddingHorizontal="l"
        marginTop="l"
        position="absolute"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box paddingHorizontal="lx" />
        {openQrCodeScanner && (
          <Text variant="h4" textAlign="center">
            {t('keystone.scanQrCode')}
          </Text>
        )}
        <CloseButton
          paddingHorizontal="lx"
          hitSlop={hitSlop}
          marginEnd="n_lx"
          onPress={() => {
            eventEmitter.emit('closeKeystoneSignatureModal', '')
          }}
        />
      </Box>
      {!openQrCodeScanner && (
        <Box
          flex={1}
          alignItems="center"
          justifyContent="space-between"
          padding="l"
          marginTop="xl"
        >
          <Box flex={1} justifyContent="center">
            <Box alignItems="center" paddingVertical="l">
              <Keystone width={48} height={48} />
              <Text variant="h0" textAlign="center" marginVertical="lm">
                {t('keystone.payment.scanTxQrcodeScreenTitle')}
              </Text>
              <Text variant="subtitle1" textAlign="center">
                {t('keystone.payment.scanTxQrcodeScreenSubtitle1')}
              </Text>
              {/* show the sol sign request qrcode  */}
              {solSignRequestUr && (
                <AnimatedQrCode
                  qrCodeType={solSignRequestUr.type}
                  cborData={solSignRequestUr.cbor.toString('hex')}
                />
              )}
              <Text variant="subtitle1" textAlign="center">
                {t('keystone.payment.scanTxQrcodeScreenSubtitle2')}
              </Text>
            </Box>
          </Box>
          <ButtonPressable
            width="100%"
            borderRadius="round"
            onPress={handleGetSignature}
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.5}
            titleColorDisabled="black500"
            titleColor="primary"
            fontWeight="500"
            title={t('keystone.payment.getSignature')}
            marginBottom="l"
          />
        </Box>
      )}
    </SafeAreaBox>
  )
}

export default React.memo(ScanTxQrcodeScreen)
