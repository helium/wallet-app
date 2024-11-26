import React, { useCallback, useState, useEffect } from 'react'
import TransportHID from '@ledgerhq/react-native-hid'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import CarotRight from '@assets/svgs/carot-right.svg'
import LedgerCircle from '@assets/svgs/ledger-circle.svg'
import Ledger from '@assets/svgs/ledger.svg'
import Text from '@components/Text'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@config/theme/themeHooks'
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
          paddingHorizontal="2"
          paddingVertical="4"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box flexDirection="row" alignItems="center">
            <Box
              marginRight="3"
              backgroundColor="secondaryBackground"
              borderRadius="full"
            >
              <LedgerCircle width={40} height={40} color={primaryText} />
            </Box>
            <Text variant="textMdRegular" color="primaryText">
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
      backgroundColor="secondaryBackground"
      marginTop="6"
      paddingHorizontal="6"
    >
      <Box
        flex={1}
        justifyContent="flex-end"
        alignItems="center"
        marginBottom="6"
      >
        <Ledger width={61} height={61} color={primaryText} />
        <Text
          variant="displayMdRegular"
          marginVertical="6"
          textAlign="center"
          lineHeight={38}
        >
          {t('ledger.scan.title')}
        </Text>
        <Text
          variant="textXlMedium"
          color="secondaryText"
          textAlign="center"
          fontSize={21}
          lineHeight={23}
        >
          {t('ledger.scan.subtitleUsb')}
        </Text>
      </Box>
      <Box flex={1} marginTop="6">
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
