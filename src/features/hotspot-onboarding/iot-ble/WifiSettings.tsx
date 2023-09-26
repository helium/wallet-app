import BackScreen from '@components/BackScreen'
import ButtonPressable from '@components/ButtonPressable'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, SectionList } from 'react-native'
import type { HotspotBleNavProp } from './navTypes'

type Section = {
  title: string
  data: string[]
  type: 'configured' | 'available'
}

const WifiSettings = () => {
  const navigation = useNavigation<HotspotBleNavProp>()
  const { t } = useTranslation()
  const navNext = useCallback(
    () => navigation.push('AddGatewayBle'),
    [navigation],
  )
  const [networks, setNetworks] = useState<string[]>()
  const [configuredNetworks, setConfiguredNetworks] = useState<string[]>()
  const [connected, setConnected] = useState(false)

  const { isConnected, readWifiNetworks, removeConfiguredWifi } =
    useHotspotBle()

  useEffect(() => {
    isConnected().then(setConnected)
  }, [isConnected])

  useEffect(() => {
    if (!connected) return

    readWifiNetworks(true).then(setConfiguredNetworks)
    readWifiNetworks(false).then(setNetworks)
  }, [connected, readWifiNetworks])

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
          navigation.push('WifiSetup', { network })
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
    [configuredNetworks, navigation, readWifiNetworks, removeConfiguredWifi, t],
  )

  const renderItem = useCallback(
    ({
      item: network,
      section: { type },
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: string
      // eslint-disable-next-line react/no-unused-prop-types
      section: Section
    }) => {
      return (
        <TouchableOpacityBox
          alignItems="center"
          padding="m"
          flexDirection="row"
          onPress={handleNetworkSelected({ network, type })}
        >
          <FabButton
            icon={type === 'configured' ? 'close' : 'add'}
            backgroundColor="secondary"
            iconColor="white"
            size={20}
            disabled
            marginRight="ms"
          />
          <Text color="secondaryText" variant="body1Medium">
            {network}
          </Text>
        </TouchableOpacityBox>
      )
    },
    [handleNetworkSelected],
  )

  const keyExtractor = useCallback((name: string) => name, [])

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: Section
  }) => (
    <Text variant="h3Medium" color="primaryText">
      {title}
    </Text>
  )

  const sections = useMemo(
    (): Section[] => [
      {
        data: configuredNetworks || [],
        title: t('hotspotOnboarding.wifiSettings.configured'),
        type: 'configured',
      },
      {
        data: networks || [],
        title: t('hotspotOnboarding.wifiSettings.available'),
        type: 'available',
      },
    ],
    [configuredNetworks, networks, t],
  )

  return (
    <BackScreen title={t('hotspotOnboarding.wifiSettings.title')}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        renderSectionHeader={renderSectionHeader}
      />
      <ButtonPressable
        marginTop="l"
        borderRadius="round"
        titleColor="black"
        borderColor="transparent"
        backgroundColor="white"
        title={t('generic.next')}
        onPress={navNext}
      />
    </BackScreen>
  )
}

export default WifiSettings
