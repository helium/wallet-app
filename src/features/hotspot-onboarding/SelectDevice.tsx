import BackScreen from '@components/BackScreen'
import Bluetooth from '@assets/images/bluetooth.svg'
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
    name: 'Bluetooth Enabled Hotspot',
    type: 'IotBle',
    icon: <Bluetooth width={50} height={50} />,
    options: {
      bleInstructions:
        'Power on your Hotspot. Follow manufacturer instructions for enabling bluetooth discovery on the Hotspot.',
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
          {item.image && (
            <ImageBox
              mr="s"
              height={50}
              width={50}
              source={{
                uri: item.image,
                cache: 'force-cache',
              }}
            />
          )}
          {item.icon && item.icon}
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
    <BackScreen title={t('hotspotOnboarding.selectOnboardingMethod.title')}>
      <Text
        variant="subtitle1"
        color="secondaryText"
        textAlign="left"
        adjustsFontSizeToFit
      >
        {t('hotspotOnboarding.selectOnboardingMethod.subtitle')}
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
