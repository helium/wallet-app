import { useNavigation } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Bluetooth } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Image } from '@ui/Image'
import { withUniwind } from 'uniwind'
import OnboardingScreen from './components/OnboardingScreen'
import { OnboardableDevice, OnboardingNavProp } from './navTypes'

const BluetoothIcon = withUniwind(Bluetooth)

const data: OnboardableDevice[] = [
  {
    name: 'Bluetooth Enabled Hotspot',
    type: 'IotBle',
    icon: (
      <BluetoothIcon
        size={32}
        className="mr-2"
        colorClassName="accent-blue-dark-500"
      />
    ),
    options: {
      bleInstructions:
        'Power on your Hotspot. Follow manufacturer instructions for enabling bluetooth discovery on the Hotspot.',
    },
  },
]

const SelectOnboardableDevice = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavProp>()
  const renderItem = ({
    item,
    index,
  }: {
    item: OnboardableDevice
    index: number
  }) => {
    return (
      <PressableScale
        onPress={() => {
          navigation.push(item.type, item.options)
        }}
        feedback="opacity"
        className={`flex-row items-center border-b border-border p-2 ${
          index === 0 ? '' : 'border-t'
        }`}
      >
        {!!item.image && (
          <Image
            className="mr-2 size-[50px]"
            source={{
              uri: item.image,
            }}
          />
        )}
        {item.icon && item.icon}
        <Text size="base" className="font-medium text-muted-foreground">
          {item.name}
        </Text>
      </PressableScale>
    )
  }

  const keyExtractor = ({ name }: OnboardableDevice) => name

  return (
    <OnboardingScreen
      title={t('hotspotOnboarding.selectOnboardingMethod.title')}
    >
      <Text
        size="xl"
        className="text-left font-medium text-muted-foreground"
        adjustsFontSizeToFit
      >
        {t('hotspotOnboarding.selectOnboardingMethod.subtitle')}
      </Text>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </OnboardingScreen>
  )
}

export default SelectOnboardableDevice
