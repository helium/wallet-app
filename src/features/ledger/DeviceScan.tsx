import React, { useCallback, useState, useRef, useEffect } from 'react'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { useSheetMargins } from '@ui/ContentColumn'
import { useTranslation } from 'react-i18next'
import { FlatList, LayoutChangeEvent, View } from 'react-native'
import { Device } from 'react-native-ble-plx'
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { ChevronRight } from 'lucide-react-native'
import { useResolveClassNames, withUniwind } from 'uniwind'
import LedgerCircle from '@assets/images/ledger-circle.svg'
import Ledger from '@assets/images/ledger.svg'
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { BackButton } from '@ui/BackButton'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import useBackHandler from '@hooks/useBackHandler'
import useLedgerDeviceScan from '@hooks/useLedgerDeviceScan'
import LedgerConnectSteps from './LedgerConnectSteps'
import {
  LedgerNavigatorNavigationProp,
  LedgerNavigatorStackParamList,
} from './ledgerNavigatorTypes'

const ChevronRightIcon = withUniwind(ChevronRight)
const LedgerIcon = withUniwind(Ledger)
const LedgerCircleIcon = withUniwind(LedgerCircle)

const ScanBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.8}
    {...props}
  />
)

type Route = RouteProp<LedgerNavigatorStackParamList, 'DeviceScan'>
const DeviceScan = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const route = useRoute<Route>()

  const backgroundStyle = useResolveClassNames('bg-secondary')
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()
  const [contentHeight, setContentHeight] = useState(0)
  const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
  const {
    refreshing,
    error,
    errorKind,
    devices,
    setError,
    startScan,
    stopScan,
  } = useLedgerDeviceScan()

  useEffect(() => {
    const routeError = route.params?.error
    if (!routeError) {
      return
    }

    setError(routeError)
    // Consume the param so the sheet does not re-present on later re-renders
    navigation.setParams({ error: undefined })
  }, [navigation, route.params?.error, setError])

  // Scan only while this screen is focused, so no scan runs during the
  // connect on DeviceShow
  useFocusEffect(
    useCallback(() => {
      void startScan()
      return stopScan
    }, [startScan, stopScan]),
  )

  let maxHeight: number | string = '90%'
  if (contentHeight > 0) {
    maxHeight = contentHeight
  }
  const snapPoints = [maxHeight]

  const clearError = () => {
    handleDismiss()
    setError(undefined)
    void startScan()
  }

  useEffect(() => {
    if (!error) return

    bottomSheetModalRef.current?.present()
    setIsShowing(true)
  }, [error, setIsShowing])

  const keyExtractor = (item: Device) => item.id

  const onSelectDevice = (device: Device) => () => {
    stopScan()
    navigation.navigate('DeviceShow', {
      ledgerDevice: {
        id: device.id,
        name: device.localName || device.name || '',
        type: 'bluetooth',
      },
    })
  }

  const handleContentLayout = (e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height + 100)
  }

  const handleRetry = () => {
    bottomSheetModalRef.current?.dismiss()
  }

  const renderItem = ({ item: device }: { item: Device }) => {
    return (
      <PressableScale
        feedback="opacity"
        onPress={onSelectDevice(device)}
        className="flex-row items-center justify-between px-2 py-4"
      >
        <View className="flex-row items-center">
          <View className="mr-3 rounded-full bg-secondary">
            <LedgerCircleIcon
              width={40}
              height={40}
              colorClassName="accent-foreground"
            />
          </View>
          <Text size="base">{device.name}</Text>
        </View>
        <ChevronRightIcon colorClassName="accent-foreground" />
      </PressableScale>
    )
  }

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-secondary px-6">
        <BackButton className="mt-4 px-2" onPress={navigation.goBack} />
        <View className="mb-6 flex-1 items-center justify-end">
          <LedgerIcon
            width={61}
            height={61}
            colorClassName="accent-foreground"
          />
          <Text size="4xl" className="my-6 text-center">
            {t('ledger.scan.title')}
          </Text>
          <Text
            size="xl"
            className="text-center font-medium text-muted-foreground"
          >
            {t('ledger.scan.subtitle')}
          </Text>
        </View>
        <View className="mt-6 flex-1">
          <FlatList
            data={devices}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onRefresh={() => void startScan().catch(console.error)}
            refreshing={refreshing}
            ListFooterComponent={<TabSafeAreaView edges={['bottom']} />}
          />
        </View>
      </View>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        style={sheetMargins}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={ScanBackdrop}
        backgroundStyle={backgroundStyle}
        onDismiss={clearError}
      >
        <BottomSheetScrollView contentInsetAdjustmentBehavior="automatic">
          <LedgerConnectSteps
            onLayout={handleContentLayout}
            onRetry={handleRetry}
            errorKind={errorKind}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  )
}

export default DeviceScan
