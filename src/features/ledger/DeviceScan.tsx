import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { useTranslation } from 'react-i18next'
import {
  FlatList,
  LayoutChangeEvent,
  PermissionsAndroid,
  Platform,
} from 'react-native'
import { useAsync } from 'react-async-hook'
import { Observable, Subscription } from 'rxjs'
import { Device } from 'react-native-ble-plx'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import CarotRight from '@assets/images/carot-right.svg'
import LedgerCircle from '@assets/images/ledger-circle.svg'
import Ledger from '@assets/images/ledger.svg'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import BackButton from '../../components/BackButton'
import Text from '../../components/Text'
import Box from '../../components/Box'
import {
  LedgerNavigatorNavigationProp,
  LedgerNavigatorStackParamList,
} from './ledgerNavigatorTypes'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import LedgerConnectSteps from './LedgerConnectSteps'
import { useColors, useOpacity } from '../../theme/themeHooks'
import * as Logger from '../../utils/logger'
import useBackHandler from '../../utils/useBackHandler'

enum DeviceModelId {
  blue = 'blue',
  nanoS = 'nanoS',
  nanoSP = 'nanoSP',
  nanoX = 'nanoX',
}

type LedgerDetails = {
  type: string
  descriptor: Device
  deviceModel: {
    id: DeviceModelId
    productName: string
    productIdMM: number
    legacyUsbProductId: number
    usbOnly: boolean
    memorySize: number
    masks: number[]
    // blockSize: number, // THIS FIELD IS DEPRECATED, use getBlockSize
    getBlockSize: (firmwareVersion: string) => number
    bluetoothSpec?: {
      serviceUuid: string
      writeUuid: string
      writeCmdUuid: string
      notifyUuid: string
    }[]
  }
}
type LedgerAvailable = {
  available: boolean
  type: string
}

type Route = RouteProp<LedgerNavigatorStackParamList, 'DeviceScan'>
const DeviceScan = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const route = useRoute<Route>()
  const { primaryText } = useColors()

  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState<Error>()
  const [refreshing, setRefreshing] = useState(false)
  const { backgroundStyle } = useOpacity('secondary', 1)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const sub = useRef<Subscription>()
  const [contentHeight, setContentHeight] = useState(0)
  const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)

  useEffect(() => {
    if (!route.params?.error) {
      return
    }

    setError(route.params.error)
  }, [route])

  const snapPoints = useMemo(() => {
    let maxHeight: number | string = '90%'
    if (contentHeight > 0) {
      maxHeight = contentHeight
    }
    return [maxHeight]
  }, [contentHeight])

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    ),
    [],
  )

  const maybeAddDevice = useCallback(
    (device: Device) => {
      if (devices.some((i: Device) => i.id === device.id)) {
        return
      }

      setDevices([...devices, device])
    },
    [devices],
  )

  const checkPermission = useCallback(async () => {
    if (
      Platform.OS !== 'android' ||
      (await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ))
    ) {
      return true
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    )
    return granted === PermissionsAndroid.RESULTS.GRANTED
  }, [])

  const startScan = useCallback(async () => {
    setRefreshing(true)

    await checkPermission()

    sub.current = new Observable<LedgerDetails>(TransportBLE.listen).subscribe({
      complete: () => {
        setRefreshing(false)
      },
      next: (e) => {
        if (e.type === 'add') {
          maybeAddDevice(e.descriptor)
        }
        setRefreshing(false)
      },
      error: (err) => {
        Logger.error(err)
        setError(err)
        setRefreshing(false)
      },
    })
  }, [checkPermission, maybeAddDevice])

  const reload = useCallback(() => {
    if (sub.current) {
      sub.current.unsubscribe()
    }

    setRefreshing(false)
    startScan()
  }, [startScan])

  const clearError = useCallback(() => {
    handleDismiss()
    setError(undefined)
    reload()
  }, [handleDismiss, reload])

  useEffect(() => {
    if (!error) return

    bottomSheetModalRef.current?.present()
    setIsShowing(true)
  }, [error, setIsShowing])

  useAsync(async () => {
    let previousAvailable: boolean | undefined
    new Observable<LedgerAvailable>(TransportBLE.observeState).subscribe(
      (e) => {
        if (e.available !== previousAvailable) {
          previousAvailable = e.available
          if (e.available) {
            reload()
          } else if (!e.available && e.type) {
            setError(new Error(e.type))
          }
        }
      },
    )
    return () => {
      if (sub.current) {
        sub.current.unsubscribe()
      }
    }
  }, [])

  const keyExtractor = useCallback((item) => item.id, [])

  const onSelectDevice = useCallback(
    (device: Device) => () => {
      navigation.navigate('DeviceShow', {
        ledgerDevice: {
          id: device.id,
          name: device.localName || device.name || '',
          type: 'bluetooth',
        },
      })
    },
    [navigation],
  )

  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height + 100)
  }, [])

  const handleRetry = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const renderItem = useCallback(
    ({ item: device }) => {
      return (
        <TouchableOpacityBox
          onPress={onSelectDevice(device)}
          paddingHorizontal="s"
          paddingVertical="m"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box flexDirection="row" alignItems="center">
            <Box
              marginRight="ms"
              backgroundColor="secondary"
              borderRadius="round"
            >
              <LedgerCircle width={40} height={40} color={primaryText} />
            </Box>
            <Text variant="body1" color="primaryText">
              {device.name}
            </Text>
          </Box>
          <CarotRight color={primaryText} />
        </TouchableOpacityBox>
      )
    },
    [onSelectDevice, primaryText],
  )

  return (
    <BottomSheetModalProvider>
      <Box flex={1} backgroundColor="primaryBackground" paddingHorizontal="l">
        <BackButton
          marginTop="m"
          paddingHorizontal="s"
          onPress={navigation.goBack}
        />
        <Box
          flex={1}
          justifyContent="flex-end"
          alignItems="center"
          marginBottom="l"
        >
          <Ledger width={61} height={61} color={primaryText} />
          <Text
            variant="h1"
            marginVertical="l"
            textAlign="center"
            lineHeight={38}
          >
            {t('ledger.scan.title')}
          </Text>
          <Text
            variant="subtitle1"
            color="secondaryText"
            textAlign="center"
            fontSize={21}
            lineHeight={23}
          >
            {t('ledger.scan.subtitle')}
          </Text>
        </Box>
        <Box flex={1} marginTop="l">
          <FlatList
            data={devices}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onRefresh={reload}
            refreshing={refreshing}
          />
        </Box>
      </Box>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle}
        onDismiss={clearError}
      >
        <BottomSheetScrollView>
          <LedgerConnectSteps
            onLayout={handleContentLayout}
            error={error}
            onRetry={handleRetry}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  )
}

export default DeviceScan
