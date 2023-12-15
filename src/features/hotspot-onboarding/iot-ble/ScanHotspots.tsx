import BackScreen from '@components/BackScreen'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { Device, useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Platform, PermissionsAndroid } from 'react-native'
import {
  PERMISSIONS,
  PermissionStatus,
  RESULTS,
  check,
  request,
} from 'react-native-permissions'
import * as Logger from '../../../utils/logger'
import type { HotspotBleNavProp } from './navTypes'
import { useIotBleOptions } from './optionsContext'

const ScanHotspots = () => {
  const { startScan, stopScan, connect, scannedDevices } = useHotspotBle()
  const [scanning, setScanning] = useState(false)
  const { bleInstructions } = useIotBleOptions()
  const [canScan, setCanScan] = useState<boolean | undefined>(undefined)
  const navigation = useNavigation<HotspotBleNavProp>()
  const { t } = useTranslation()
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

  const navNext = useCallback(() => navigation.push('Settings'), [navigation])

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
    <BackScreen title={t('hotspotOnboarding.scan.title')}>
      <Text
        marginTop="m"
        marginBottom="m"
        variant="subtitle1"
        color="secondaryText"
        textAlign="left"
        adjustsFontSizeToFit
      >
        {bleInstructions || t('hotspotOnboarding.scan.subtitle')}
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
    </BackScreen>
  )
}

export default ScanHotspots
