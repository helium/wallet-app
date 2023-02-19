import React, { useCallback, useState, useEffect } from 'react'
import TransportHID from '@ledgerhq/react-native-hid'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import CarotRight from '@assets/images/carot-right.svg'
import LedgerCircle from '@assets/images/ledger-circle.svg'
import Ledger from '@assets/images/ledger.svg'
import Text from '@components/Text'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@theme/themeHooks'
import SafeAreaBox from '@components/SafeAreaBox'
import { LedgerNavigatorNavigationProp } from './ledgerNavigatorTypes'

type Device = {
  deviceId: number
  deviceName: string
  name: string
  productId: number
  vendorId: number
}
const DeviceScanUsb = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const { primaryText } = useColors()

  const [devices, setDevices] = useState<Device[]>([])
  const [transportReady, setTransportReady] = useState(false)

  useEffect(() => {
    TransportHID.create().then((transport) => setTransportReady(!!transport))
  }, [])

  useEffect(() => {
    if (!transportReady) return

    TransportHID.list().then(setDevices)
  }, [transportReady])
  const keyExtractor = useCallback((item) => item.deviceId, [])

  const onSelectDevice = useCallback(
    (device: Device) => () => {
      navigation.navigate('DeviceShow', {
        ledgerDevice: {
          id: device.deviceId.toString(),
          name: device.productId.toString(),
          type: 'usb',
        },
      })
    },
    [navigation],
  )

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
    <SafeAreaBox
      flex={1}
      backgroundColor="secondary"
      marginTop="l"
      paddingHorizontal="l"
    >
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
          {t('ledger.scan.subtitleUsb')}
        </Text>
      </Box>
      <Box flex={1} marginTop="l">
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      </Box>
    </SafeAreaBox>
  )
}

export default DeviceScanUsb
