import BackButton from '@components/BackButton'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import FabButton from '@components/FabButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { Device, useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Platform } from 'react-native'
import {
  PERMISSIONS,
  PermissionStatus,
  RESULTS,
  check,
  request,
} from 'react-native-permissions'
import * as Logger from '../../utils/logger'
import type { HotspotBleNavProp } from './navTypes'

const ScanHotspots = () => {
  const { startScan, stopScan, connect, scannedDevices } = useHotspotBle()
  const [scanning, setScanning] = useState(false)
  const [canScan, setCanScan] = useState<boolean | undefined>(undefined)
  const navigation = useNavigation<HotspotBleNavProp>()
  const { t } = useTranslation()
  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])
  const [error, setError] = useState<string | undefined>(undefined)

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

  const handleScanPress = useCallback(() => {
    const shouldScan = !scanning
    setScanning(shouldScan)
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
      }
    }
  }, [scannedDevices.length, scanning, startScan, stopScan])

  const navNext = useCallback(
    () => navigation.push('WifiSettings'),
    [navigation],
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
      return (
        <TouchableOpacityBox
          onPress={connectDevice(item)}
          alignItems="center"
          padding="m"
          flexDirection="row"
          borderTopWidth={1}
          borderColor="grey900"
          borderBottomWidth={1}
          disabled={connecting}
        >
          <FabButton
            icon="add"
            backgroundColor="secondary"
            iconColor="white"
            size={20}
            disabled
            marginRight="ms"
          />
          <Text color="secondaryText" variant="body1Medium">
            {item.name}
          </Text>
        </TouchableOpacityBox>
      )
    },
    [connectDevice, connecting],
  )

  const keyExtractor = React.useCallback(({ id }: Device) => id, [])

  return (
    <SafeAreaBox paddingHorizontal="l" flex={1}>
      <BackButton onPress={onBack} paddingHorizontal="none" />
      <Text variant="h1">{t('hotspotOnboarding.scan.title')}</Text>
      <Text
        marginTop="m"
        marginBottom="m"
        variant="subtitle1"
        color="secondaryText"
        textAlign="left"
        adjustsFontSizeToFit
      >
        {t('hotspotOnboarding.scan.subtitle')}
      </Text>
      {scannedDevices.length === 0 && scanning && <CircleLoader />}
      {scannedDevices.length === 0 && scanning && (
        <Text
          mt="s"
          variant="body1Medium"
          textAlign="center"
          color="secondaryText"
        >
          {t('hotspotOnboarding.scan.scanning')}
        </Text>
      )}

      <FlatList
        data={scannedDevices}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      {error && (
        <Text variant="body1Medium" color="red500">
          {error}
        </Text>
      )}
      <ButtonPressable
        marginTop="l"
        borderRadius="round"
        titleColor={scanning ? 'white' : 'black'}
        borderColor={scanning ? 'white' : 'transparent'}
        borderWidth={scanning ? 2 : 0}
        backgroundColor={scanning ? 'transparent' : 'white'}
        title={
          // eslint-disable-next-line no-nested-ternary
          canScan
            ? scanning
              ? t('hotspotOnboarding.scan.stop')
              : t('hotspotOnboarding.scan.start')
            : t('hotspotOnboarding.scan.notEnabled')
        }
        onPress={handleScanPress}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        disabled={!canScan || connecting}
      />
    </SafeAreaBox>
  )
}

export default ScanHotspots
