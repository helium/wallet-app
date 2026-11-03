import { useHotspotBle } from '@helium/react-native-sdk'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Plus, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, SectionList, View } from 'react-native'
import { withUniwind } from 'uniwind'
import OnboardingScreen from '../components/OnboardingScreen'
import type { HotspotBLEStackParamList, HotspotBleNavProp } from './navTypes'

const PlusIcon = withUniwind(Plus)
const RemoveIcon = withUniwind(X)

type Section = {
  title: string
  data: string[]
  type: 'configured' | 'available'
}

type Route = RouteProp<HotspotBLEStackParamList, 'WifiSettings'>

const WifiSettings = () => {
  const {
    params: { network: networkIn },
  } = useRoute<Route>()
  const navigation = useNavigation<HotspotBleNavProp>()
  const { t } = useTranslation()
  const navNext = () => navigation.goBack()
  const [networks, setNetworks] = useState<string[]>()
  const [configuredNetworks, setConfiguredNetworks] = useState<string[]>()
  const [connected, setConnected] = useState(false)

  const { isConnected, readWifiNetworks, removeConfiguredWifi } =
    useHotspotBle()

  useEffect(() => {
    void isConnected().then(setConnected)
  }, [isConnected])

  const {
    mutate: handleRefresh,
    isPending: refreshing,
    error,
  } = useMutation({
    mutationFn: async () => {
      if (!connected) return

      const configured = await readWifiNetworks(true)
      setConfiguredNetworks(configured)
      const available = await readWifiNetworks(false)
      setNetworks(available)
    },
  })

  // Refresh on network change or on load
  useEffect(() => {
    void handleRefresh()
  }, [handleRefresh, networkIn, connected])

  const handleNetworkSelected =
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
              onPress: () =>
                void (async () => {
                  setConfiguredNetworks(
                    configuredNetworks?.filter((n) => n !== network),
                  )
                  await removeConfiguredWifi(network)
                  void readWifiNetworks(true).then(setConfiguredNetworks)
                  void readWifiNetworks(false).then(setNetworks)
                })(),
            },
          ],
        )
      }
    }

  const renderItem = ({
    item: network,
    section: { type },
  }: {
    item: string
    section: Section
  }) => {
    return (
      <PressableScale
        feedback="opacity"
        className="flex-row items-center p-4"
        onPress={() =>
          void handleNetworkSelected({ network, type })().catch(console.error)
        }
      >
        <View className="mr-3 size-5 items-center justify-center rounded-full bg-secondary">
          {type === 'configured' ? (
            <RemoveIcon size={12} colorClassName="accent-foreground" />
          ) : (
            <PlusIcon size={12} colorClassName="accent-foreground" />
          )}
        </View>
        <Text size="base" className="font-medium text-muted-foreground">
          {network}
        </Text>
      </PressableScale>
    )
  }

  const keyExtractor = (name: string) => name

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: Section
  }) => (
    <Text size="2xl" className="font-medium">
      {title}
    </Text>
  )

  const sections: Section[] = [
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
  ]

  return (
    <OnboardingScreen title={t('hotspotOnboarding.wifiSettings.title')}>
      {error && (
        <Text size="base" className="font-medium text-destructive">
          {error.message ? error.message.toString() : error.toString()}
        </Text>
      )}
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        sections={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        renderSectionHeader={renderSectionHeader}
        refreshing={refreshing}
        onRefresh={() => handleRefresh()}
      />
      <Button
        variant="cta"
        size="dashboard"
        className="mt-6 w-full"
        onPress={navNext}
      >
        {t('generic.done')}
      </Button>
    </OnboardingScreen>
  )
}

export default WifiSettings
