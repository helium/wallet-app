import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import { useSpacing, useColors } from '@config/theme/themeHooks'
import { BleError, Device, useHotspotBle } from '@helium/react-native-sdk'
import { wp } from '@utils/layout'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Carousel from 'react-native-snap-carousel'
import { useTranslation } from 'react-i18next'
import TouchableContainer from '@components/TouchableContainer'
import Text from '@components/Text'
import CarotRight from '@assets/svgs/carot-right.svg'
import {
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native'
import ScrollBox from '@components/ScrollBox'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import RightArrow from '@assets/svgs/rightArrow.svg'
import {
  check,
  PERMISSIONS,
  request,
  RESULTS,
  PermissionStatus,
} from 'react-native-permissions'
import * as Logger from '@utils/logger'
import { useAsyncCallback } from 'react-async-hook'
import { ButtonPressable, ImageBox, TextInput } from '@components/index'
import Visibility from '@assets/svgs/visibility.svg'
import VisibilityOff from '@assets/svgs/visibilityOff.svg'
import { useNavigation } from '@react-navigation/native'
import Config from 'react-native-config'
import Checkmark from '@assets/svgs/checkmark.svg'

const MOCK = Config.MOCK_IOT === 'true'
const MOCK_DEVICES = [
  { id: '1', name: 'RAK-78908' },
  { id: '2', name: 'Helium-Hotspot-775' },
] as Device[]

type CarouselItem = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Screen: (ScreenProps) => React.JSX.Element
}

const ModifyWifiScreen = () => {
  const carouselRef = useRef<Carousel<CarouselItem>>(null)
  const [network, setNetwork] = useState<string | undefined>(undefined)

  const slides = useMemo(() => {
    return [
      {
        Screen: ScanHotspots,
      },
      {
        Screen: WifiSettings,
      },
      {
        Screen: WifiSetup,
      },
    ]
  }, [])

  const renderCarouselItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: CarouselItem }) => {
      return (
        <item.Screen
          carouselRef={carouselRef}
          onNetworkSelected={setNetwork}
          network={network}
        />
      )
    },
    [network],
  )

  return (
    <BackScreen padding="0" paddingBottom="2xl">
      <Carousel
        ref={carouselRef}
        loop={false}
        inactiveSlideOpacity={0.3}
        shouldOptimizeUpdates
        layout="default"
        vertical={false}
        scrollEnabled={false}
        data={slides}
        renderItem={renderCarouselItem}
        sliderWidth={wp(100)}
        itemWidth={wp(100)}
        inactiveSlideScale={1}
      />
    </BackScreen>
  )
}

const ScanHotspots = ({
  carouselRef,
}: {
  carouselRef: React.RefObject<Carousel<CarouselItem>>
}) => {
  const { startScan, stopScan, connect, scannedDevices } = useHotspotBle()
  const [scanning, setScanning] = useState(false)
  const colors = useColors()
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

  const navNext = useCallback(
    () => carouselRef?.current?.snapToNext(),
    [carouselRef],
  )

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
  }, [scannedDevices, scanning, startScan, stopScan])

  const [connecting, setConnecting] = useState(false)
  const connectDevice = useCallback(
    (d: Device) => async () => {
      if (MOCK) {
        navNext()
        return
      }

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

const WifiSettings = ({
  carouselRef,
  onNetworkSelected,
}: {
  carouselRef: React.RefObject<Carousel<CarouselItem>>
  onNetworkSelected: (network: string) => void
}) => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const [networks, setNetworks] = useState<string[]>()
  const [configuredNetworks, setConfiguredNetworks] = useState<string[]>()
  const [connected, setConnected] = useState(false)

  const { isConnected, readWifiNetworks, removeConfiguredWifi } =
    useHotspotBle()

  useEffect(() => {
    isConnected().then(setConnected)
  }, [isConnected])

  const {
    execute: handleRefresh,
    loading: refreshing,
    error,
  } = useAsyncCallback(async () => {
    if (MOCK) {
      setConfiguredNetworks(['Solana-House-5678'])
      setNetworks(['Helium-House-1234'])
      return
    }

    if (!connected) return

    const configured = await readWifiNetworks(true)
    setConfiguredNetworks(configured)
    const available = await readWifiNetworks(false)
    setNetworks(available)
  })

  // Refresh on network change or on load
  useEffect(() => {
    handleRefresh()
  }, [handleRefresh, connected])

  const handleNetworkSelected = useCallback(
    ({
        network,
        type,
      }: {
        network: string
        type: 'configured' | 'available'
      }) =>
      async () => {
        if (type === 'available') {
          onNetworkSelected(network)
          carouselRef?.current?.snapToNext()
        } else {
          Alert.alert(
            t('hotspotOnboarding.wifiSettings.title'),
            t('hotspotOnboarding.wifiSettings.remove', { network }),
            [
              {
                text: t('generic.cancel'),
                style: 'default',
              },
              {
                text: t('generic.remove'),
                style: 'destructive',
                onPress: async () => {
                  setConfiguredNetworks(
                    configuredNetworks?.filter((n) => n !== network),
                  )
                  await removeConfiguredWifi(network)
                  readWifiNetworks(true).then(setConfiguredNetworks)
                  readWifiNetworks(false).then(setNetworks)
                },
              },
            ],
          )
        }
      },
    [
      onNetworkSelected,
      carouselRef,
      t,
      configuredNetworks,
      removeConfiguredWifi,
      readWifiNetworks,
    ],
  )

  const data = useMemo(
    () => [...(configuredNetworks || []), ...(networks || [])],
    [configuredNetworks, networks],
  )

  const renderItem = useCallback(
    ({
      item: network,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: string
      // eslint-disable-next-line react/no-unused-prop-types
    }) => {
      const first = data[0] === network
      const last = data[data.length - 1] === network
      const borderTopStartRadius = first ? '2xl' : 'none'
      const borderBottomStartRadius = last ? '2xl' : 'none'
      const borderBottomEndRadius = last ? '2xl' : 'none'
      const borderTopEndRadius = first ? '2xl' : 'none'

      const isConfigured = configuredNetworks?.includes(network)

      return (
        <TouchableContainer
          alignItems="center"
          paddingVertical="xl"
          paddingStart="xl"
          paddingEnd="3xl"
          flexDirection="row"
          onPress={handleNetworkSelected({
            network,
            type: configuredNetworks?.includes(network)
              ? 'configured'
              : 'available',
          })}
          borderTopStartRadius={borderTopStartRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          borderTopEndRadius={borderTopEndRadius}
          marginBottom={last ? '2xl' : '0.5'}
        >
          <Text color="secondaryText" variant="textMdSemibold" flex={1}>
            {network}
          </Text>
          {!isConfigured && (
            <CarotRight color={colors['text.quaternary-500']} />
          )}
          {isConfigured && <Checkmark color={colors['success.500']} />}
        </TouchableContainer>
      )
    },
    [handleNetworkSelected, data, colors, configuredNetworks],
  )

  const keyExtractor = useCallback((name: string) => name, [])

  const renderHeader = useCallback(
    () => (
      <Box gap="2.5" marginBottom="2xl">
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('hotspotOnboarding.wifiSettings.title')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('hotspotOnboarding.wifiSettings.subtitle')}
        </Text>
        {error && (
          <Text variant="textMdMedium" color="error.500">
            {error.message ? error.message.toString() : error.toString()}
          </Text>
        )}
      </Box>
    ),
    [error, t],
  )

  const renderFooter = useCallback(
    () => (
      <TouchableOpacityBox
        onPress={handleRefresh}
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
          {refreshing
            ? t('hotspotOnboarding.scan.stop')
            : t('hotspotOnboarding.scan.start')}
        </Text>
        <RightArrow color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
    ),
    [colors, handleRefresh, refreshing, t],
  )

  const contentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      flex: 1,
    }),
    [spacing],
  )

  const flatListContentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
    }),
    [spacing],
  )

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={refreshing}
          onRefresh={handleRefresh}
          title=""
          tintColor={colors.primaryText}
        />
      }
    >
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={
          flatListContentContainerStyle as StyleProp<ViewStyle>
        }
      />
    </ScrollBox>
  )
}

const WifiSetup = ({ network }: { network: string }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const { setWifi } = useHotspotBle()
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const navigation = useNavigation()

  const toggleSecureEntry = useCallback(() => {
    setSecureTextEntry(!secureTextEntry)
  }, [secureTextEntry])

  const handleSetWifi = useCallback(async () => {
    setLoading(true)
    try {
      await setWifi(network, password)
      navigation.goBack()
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as BleError).toString())
      }
    }
    setLoading(false)
  }, [password, setWifi, network, navigation])

  const contentContainer = useMemo(
    () => ({
      paddingHorizontal: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
    }),
    [spacing],
  )

  return (
    <ScrollBox contentContainerStyle={contentContainer as StyleProp<ViewStyle>}>
      <Box alignItems="center" marginBottom="2xl" paddingHorizontal="4xl">
        <ImageBox
          marginBottom="2xl"
          source={require('@assets/images/passwordIcon.png')}
        />
        <Text variant="displayMdSemibold" color="primaryText">
          {t('hotspotOnboarding.wifiSetup.title')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          marginTop="2.5"
          textAlign="center"
        >
          {t('hotspotOnboarding.wifiSetup.subtitle', { network })}
        </Text>
        {error && (
          <Text variant="textSmRegular" color="error.500" marginTop="2.5">
            {error}
          </Text>
        )}
      </Box>
      <Box
        flexDirection="row"
        backgroundColor="cardBackground"
        borderRadius="2xl"
        paddingEnd="3xl"
        padding="2"
      >
        <TextInput
          variant="transparentSmall"
          flexGrow={1}
          textInputProps={{
            placeholder: t('hotspotOnboarding.wifiSetup.enterPassword'),
            autoCorrect: false,
            secureTextEntry,
            autoComplete: 'off',
            onChangeText: setPassword,
            value: password,
            autoFocus: true,
            keyboardAppearance: 'dark',
          }}
        />
        <TouchableOpacityBox
          onPress={toggleSecureEntry}
          justifyContent="center"
        >
          {secureTextEntry ? (
            <Visibility color={colors.primaryText} />
          ) : (
            <VisibilityOff color={colors.primaryText} />
          )}
        </TouchableOpacityBox>
      </Box>

      <ButtonPressable
        marginTop="2xl"
        onPress={handleSetWifi}
        title={t('hotspotOnboarding.wifiSetup.setWifi')}
        loading={loading}
        backgroundColor="primaryText"
        titleColor="primaryBackground"
      />
    </ScrollBox>
  )
}

export default ModifyWifiScreen
