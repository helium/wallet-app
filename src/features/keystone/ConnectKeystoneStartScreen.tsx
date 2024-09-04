import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useNavigation } from '@react-navigation/native'
import WarningKeystone from '@assets/images/warningKeystone.svg'
import React, {
  forwardRef,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import useCamera from '@hooks/useCamera'
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useOpacity, useSpacing } from '@theme/themeHooks'
import useBackHandler from '@hooks/useBackHandler'
import { useTheme } from '@shopify/restyle'
import { t } from 'i18next'
import { RootNavigationProp } from 'src/navigation/rootTypes'
import { Image, Linking, Platform } from 'react-native'

type CameraPermissionBottomSheetAlertRef = {
  show: () => void
  dismiss: () => void
}

const CameraPermissionBottomSheetAlert = forwardRef(
  (
    { children }: { children: ReactNode },
    ref: Ref<CameraPermissionBottomSheetAlertRef>,
  ) => {
    useImperativeHandle(ref, () => ({
      show: () => {
        bottomSheetModalRef.current?.present()
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss()
      },
    }))

    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { m } = useSpacing()
    const { colors } = useTheme()
    const snapPoints = useMemo(() => ['40%'], [])
    const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
    const { handleDismiss } = useBackHandler(bottomSheetModalRef)
    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: colors.secondaryText,
      }
    }, [colors.secondaryText])
    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        backgroundStyle={backgroundStyle}
        backdropComponent={renderBackdrop}
        snapPoints={snapPoints}
        handleStyle={sheetHandleStyle}
        onDismiss={handleDismiss}
        handleIndicatorStyle={handleIndicatorStyle}
      >
        {children}
      </BottomSheetModal>
    )
  },
)

const WarningContent = () => {
  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }
  return (
    <SafeAreaBox
      flex={1}
      justifyContent="center"
      marginHorizontal="l"
      edges={['bottom']}
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <WarningKeystone />
          <Text variant="body0" textAlign="center" marginVertical="l">
            {t('keystone.connectKeystoneStart.warning')}
          </Text>
        </Box>
      </Box>
      <ButtonPressable
        borderRadius="round"
        onPress={handleOpenSettings}
        backgroundColor="primaryText"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="black500"
        titleColor="primary"
        fontWeight="500"
        title={t('keystone.connectKeystoneStart.ok')}
        marginBottom="l"
      />
    </SafeAreaBox>
  )
}

const ConnectKeystoneStart = () => {
  const { hasPermission } = useCamera()
  const cameraPermissionBottomSheetAlertRef =
    useRef<CameraPermissionBottomSheetAlertRef>(null)
  const rootNav = useNavigation<RootNavigationProp>()
  const handleStart = useCallback(() => {
    if (!hasPermission) {
      cameraPermissionBottomSheetAlertRef.current?.show()
    } else {
      rootNav.navigate('ScanQrCode')
    }
  }, [rootNav, hasPermission])
  return (
    <SafeAreaBox
      flex={1}
      justifyContent="center"
      marginHorizontal="l"
      edges={['bottom']}
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <Image
            source={require('../../assets/images/connectKeystoneLogo.png')}
          />
          <Text variant="h0" textAlign="center" marginVertical="l">
            {t('keystone.connectKeystoneStart.title')}
          </Text>
          <Text variant="subtitle1" textAlign="center">
            {t('keystone.connectKeystoneStart.subtitle')}
          </Text>
        </Box>
      </Box>
      <CameraPermissionBottomSheetAlert
        ref={cameraPermissionBottomSheetAlertRef}
      >
        <WarningContent />
      </CameraPermissionBottomSheetAlert>
      <ButtonPressable
        borderRadius="round"
        onPress={handleStart}
        backgroundColor="primaryText"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="black500"
        titleColor="primary"
        fontWeight="500"
        title={t('keystone.connectKeystoneStart.scanQrCode')}
        marginBottom="l"
      />
    </SafeAreaBox>
  )
}

export default React.memo(ConnectKeystoneStart)
