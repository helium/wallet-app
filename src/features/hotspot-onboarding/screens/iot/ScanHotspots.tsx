import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { Device, useHotspotBle } from '@helium/react-native-sdk'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import RightArrow from '@assets/svgs/rightArrow.svg'
import {
  FlatList,
  Platform,
  PermissionsAndroid,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {
  PERMISSIONS,
  PermissionStatus,
  RESULTS,
  check,
  request,
} from 'react-native-permissions'
import ScrollBox from '@components/ScrollBox'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import Box from '@components/Box'
import TouchableContainer from '@components/TouchableContainer'
import CarotRight from '@assets/svgs/carot-right.svg'
import Config from 'react-native-config'
import * as Logger from '@utils/logger'
import { useHotspotOnboarding } from '../../OnboardingSheet'

const MOCK = Config.MOCK_IOT === 'true'
const MOCK_DEVICES = [
  { id: '1', name: 'RAK-78908' },
  { id: '2', name: 'Helium-Hotspot-775' },
] as Device[]

const ScanHotspots = () => {
  const { startScan, stopScan, connect, scannedDevices } = useHotspotBle()
  const [scanning, setScanning] = useState(false)
  const colors = useColors()
  const { carouselRef } = useHotspotOnboarding()
  const [canScan, setCanScan] = useState<boolean | undefined>(undefined)
  const spacing = useSpacing()
  const { t } = useTranslation()
  const [error, setError] = useState<string | undefined>(undefined)

  const bluetoothDevices = useMemo(() => {
    if (MOCK) {
      return MOCK_DEVICES
    }
    return scannedDevices
  }, [scannedDevices])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showError = (e: any) => {
    Logger.error(e)
    setError(e.toString())
  }

  const updateCanScan = useCallback((result: PermissionStatus) => {
    switch (result) {
      case RESULTS.UNAVAILABLE:
      case RESULTS.BLOCKED:
      case RESULTS.DENIED:
      case RESULTS.LIMITED:
        setCanScan(false)
        break
      case RESULTS.GRANTED:
        setCanScan(true)
        break
    }
  }, [])

  useEffect(() => {
    if (Platform.OS === 'ios') {
      setCanScan(true)
      return
    }

    check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
      .then(updateCanScan)
      .catch(showError)
  }, [updateCanScan])

  useEffect(() => {
    if (canScan !== false) return

    request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
      .then(updateCanScan)
      .catch(showError)
  }, [canScan, updateCanScan])

  const checkPermission = async () => {
    if (Platform.OS === 'ios') {
      return true
    }

    const perms = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]

    const results = await Promise.all(
      perms.map((p) => PermissionsAndroid.check(p)),
    )

    if (results.findIndex((r) => r === false) === -1) {
      return true
    }

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ])

    perms.forEach((p) => {
      if (!granted[p]) {
        return false
      }
    })

    return true
  }

  const handleScanPress = useCallback(async () => {
    const shouldScan = !scanning
    setScanning(shouldScan)
    await checkPermission()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timeout: any | undefined
    if (shouldScan) {
      setError(undefined)
      timeout = setTimeout(() => {
        stopScan()
        setScanning(false)
        if (scannedDevices.length === 0) {
          setError(
            'No hotspots found. Please ensure bluetooth pairing is enabled',
          )
        }
      }, 30 * 1000)
    }

    if (shouldScan) {
      startScan((e) => {
        if (e) {
          showError(e)
        }
      })
    } else {
      stopScan()
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout)
        stopScan()
      }
    }
  }, [scannedDevices.length, scanning, startScan, stopScan])

  const navNext = useCallback(
    () => carouselRef?.current?.snapToNext(),
    [carouselRef],
  )

  const [connecting, setConnecting] = useState(false)
  const connectDevice = useCallback(
    (d: Device) => async () => {
      try {
        setConnecting(true)
        await connect(d)
        if (scanning) {
          stopScan()
          setScanning(false)
        }
        setConnecting(false)
        navNext()
      } catch (e) {
        showError(e)
      } finally {
        setConnecting(false)
      }
    },
    [connect, navNext, scanning, stopScan],
  )

  const renderItem = React.useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: Device }) => {
      const first = item.id === bluetoothDevices[0].id
      const last = item.id === bluetoothDevices[bluetoothDevices.length - 1].id
      const borderTopStartRadius = first ? '2xl' : 'none'
      const borderTopEndRadius = first ? '2xl' : 'none'
      const borderBottomStartRadius = last ? '2xl' : 'none'
      const borderBottomEndRadius = last ? '2xl' : 'none'
      return (
        <TouchableContainer
          onPress={connectDevice(item)}
          alignItems="center"
          paddingHorizontal="3xl"
          paddingVertical="xl"
          flexDirection="row"
          disabled={connecting}
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          marginBottom={!last ? '0.5' : '2xl'}
        >
          <Text color="primaryText" variant="textMdSemibold" flex={1}>
            {item.name}
          </Text>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
      )
    },
    [connectDevice, connecting, bluetoothDevices, colors],
  )

  const renderHeader = useCallback(() => {
    return (
      <Box marginBottom="2xl">
        <Text
          marginTop="4"
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
          adjustsFontSizeToFit
          paddingHorizontal="xl"
        >
          {t('hotspotOnboarding.scan.title')}
        </Text>
        {bluetoothDevices.length > 0 && (
          <Text
            mt="2.5"
            variant="textLgRegular"
            textAlign="center"
            color="text.quaternary-500"
          >
            {t('hotspotOnboarding.scan.hotspotsFound', {
              count: bluetoothDevices.length,
            })}
          </Text>
        )}
        {error && (
          <Text
            mt="2.5"
            variant="textMdMedium"
            color="error.500"
            textAlign="center"
          >
            {error}
          </Text>
        )}
      </Box>
    )
  }, [t, bluetoothDevices, error])

  const renderFooter = useCallback(() => {
    return (
      <TouchableOpacityBox
        onPress={handleScanPress}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap="1.5"
      >
        <Text
          variant="textMdMedium"
          textAlign="center"
          color="text.quaternary-500"
        >
          {canScan
            ? scanning
              ? t('hotspotOnboarding.scan.stop')
              : t('hotspotOnboarding.scan.start')
            : t('hotspotOnboarding.scan.notEnabled')}
        </Text>
        <RightArrow color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
    )
  }, [canScan, handleScanPress, scanning, t, colors])

  const contentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
    }),
    [spacing],
  )

  const keyExtractor = React.useCallback(({ id }: Device) => id, [])

  return (
    <ScrollBox
      refreshControl={
        <RefreshControl
          enabled
          refreshing={scanning}
          onRefresh={handleScanPress}
          title=""
          tintColor={colors.primaryText}
        />
      }
      contentContainerStyle={{
        flex: 1,
      }}
    >
      <FlatList
        contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
        ListHeaderComponent={renderHeader}
        data={bluetoothDevices}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooter}
      />
    </ScrollBox>
  )
}

export default ScanHotspots
