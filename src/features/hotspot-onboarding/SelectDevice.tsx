import BackScreen from '@components/BackScreen'
import CircleLoader from '@components/CircleLoader'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useNavigation } from '@react-navigation/native'
import { getOnboardingDevices } from '@utils/walletApiV2'
import React from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { OnboardableDevice, OnboardingNavProp } from './navTypes'

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
  const { result: data, loading } = useAsync(() => getOnboardingDevices(), [])

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
      {loading && <CircleLoader />}
      <FlatList
        data={data || []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </BackScreen>
  )
}

export default SelectOnboardableDevice
