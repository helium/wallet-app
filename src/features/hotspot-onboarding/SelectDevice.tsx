import BackScreen from '@components/BackScreen'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { OnboardableDevice, OnboardingNavProp } from './navTypes'

const data: OnboardableDevice[] = [
  {
    name: 'Rak V2',
    type: 'IotBle',
    image:
      'https://cdn.shopify.com/s/files/1/0177/8784/6756/t/58/assets/pf-0b98ac45--pfa8f02b76untitled106.png?v=1611822325',
    options: {
      bleInstructions:
        'Power on your hotspot. Then press the button on the side of the hotspot to enable BLE.',
    },
  },
  {
    name: 'Generic Bluetooth Enabled Hotspot',
    type: 'IotBle',
    image:
      'https://shdw-drive.genesysgo.net/6tcnBSybPG7piEDShBcrVtYJDPSvGrDbVvXmXKpzBvWP/hotspot.png',
    options: {
      bleInstructions:
        'Power on your hotspot. Depending on your hotspot, there is either a button to enable BLE, or BLE will be enabled for the first 5 minutes after powering on.',
    },
  },
]

const SelectOnboardableDevice = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavProp>()
  const renderItem = React.useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: OnboardableDevice; index: number }) => {
      return (
        <TouchableOpacityBox
          onPress={() => {
            navigation.push(item.type, item.options)
          }}
          alignItems="center"
          padding="s"
          flexDirection="row"
          borderTopWidth={index === 0 ? 0 : 1}
          borderColor="grey900"
          borderBottomWidth={1}
        >
          <ImageBox
            mr="s"
            height={50}
            width={50}
            source={{
              uri: item.image,
              cache: 'force-cache',
            }}
          />
          <Text color="secondaryText" variant="body1Medium">
            {item.name}
          </Text>
        </TouchableOpacityBox>
      )
    },
    [navigation],
  )

  const keyExtractor = React.useCallback(
    ({ name }: OnboardableDevice) => name,
    [],
  )

  return (
    <BackScreen title={t('hotspotOnboarding.selectDevice.title')}>
      <Text
        variant="subtitle1"
        color="secondaryText"
        textAlign="left"
        adjustsFontSizeToFit
      >
        {t('hotspotOnboarding.selectDevice.subtitle')}
      </Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </BackScreen>
  )
}

export default SelectOnboardableDevice
