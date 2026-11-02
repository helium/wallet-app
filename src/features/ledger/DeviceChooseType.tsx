import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { useNavigation } from '@react-navigation/native'
import Ledger from '@assets/images/ledger.svg'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { LedgerNavigatorNavigationProp } from './ledgerNavigatorTypes'

const SafeArea = withUniwind(TabSafeAreaView)
const LedgerIcon = withUniwind(Ledger)

const DeviceChooseType = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()

  const navNext = (type: 'usb' | 'bluetooth') => () => {
    switch (type) {
      case 'bluetooth':
        navigation.navigate('DeviceScan')
        break
      case 'usb':
        navigation.navigate('DeviceScanUsb')
        break
    }
  }

  return (
    <SafeArea className="mt-6 flex-1 bg-background px-8">
      <Text size="4xl" className="my-8 text-center">
        {t('ledger.chooseType.title')}
      </Text>
      <PressableScale
        feedback="opacity"
        onPress={navNext('bluetooth')}
        className="mb-6 flex-row items-center"
      >
        <LedgerIcon width={26} height={26} colorClassName="accent-foreground" />
        <View className="ml-3">
          <Text size="xl" className="font-medium">
            {t('ledger.chooseType.bluetooth.title')}
          </Text>
          <Text size="base" className="text-muted-foreground">
            {t('ledger.chooseType.bluetooth.types')}
          </Text>
        </View>
      </PressableScale>
      <PressableScale
        feedback="opacity"
        onPress={navNext('usb')}
        className="mb-6 flex-row items-center"
      >
        <LedgerIcon width={26} height={26} colorClassName="accent-foreground" />
        <View className="ml-3">
          <Text size="xl" className="font-medium">
            {t('ledger.chooseType.usb.title')}
          </Text>
          <Text size="base" className="text-muted-foreground">
            {t('ledger.chooseType.usb.types')}
          </Text>
        </View>
      </PressableScale>
    </SafeArea>
  )
}

export default DeviceChooseType
