import React, { useState, useEffect } from 'react'
import TransportHID from '@ledgerhq/react-native-hid'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { useNavigation } from '@react-navigation/native'
import { ChevronRight } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import LedgerCircle from '@assets/images/ledger-circle.svg'
import Ledger from '@assets/images/ledger.svg'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { LedgerNavigatorNavigationProp } from './ledgerNavigatorTypes'

const SafeArea = withUniwind(TabSafeAreaView)
const ChevronRightIcon = withUniwind(ChevronRight)
const LedgerIcon = withUniwind(Ledger)
const LedgerCircleIcon = withUniwind(LedgerCircle)

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

  const [devices, setDevices] = useState<Device[]>([])
  const [transportReady, setTransportReady] = useState(false)

  useEffect(() => {
    void TransportHID.create().then((transport) =>
      setTransportReady(!!transport),
    )
  }, [])

  useEffect(() => {
    if (!transportReady) return

    void TransportHID.list().then(setDevices)
  }, [transportReady])
  const keyExtractor = (item: Device) => item.deviceId.toString()

  const onSelectDevice = (device: Device) => () => {
    navigation.navigate('DeviceShow', {
      ledgerDevice: {
        id: device.deviceId.toString(),
        name: device.productId.toString(),
        type: 'usb',
      },
    })
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
    <View className="mt-6 flex-1 bg-secondary px-6">
      <SafeArea
        edges={['top']}
        className="mb-6 flex-1 items-center justify-end"
      >
        <LedgerIcon width={61} height={61} colorClassName="accent-foreground" />
        <Text size="4xl" className="my-6 text-center">
          {t('ledger.scan.title')}
        </Text>
        <Text
          size="xl"
          className="text-center font-medium text-muted-foreground"
        >
          {t('ledger.scan.subtitleUsb')}
        </Text>
      </SafeArea>
      <View className="mt-6 flex-1">
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListFooterComponent={<TabSafeAreaView edges={['bottom']} />}
        />
      </View>
    </View>
  )
}

export default DeviceScanUsb
