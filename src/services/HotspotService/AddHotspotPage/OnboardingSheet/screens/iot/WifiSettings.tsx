import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useHotspotBle } from '@helium/react-native-sdk'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native'
import ScrollBox from '@components/ScrollBox'
import { useColors, useSpacing } from '@theme/themeHooks'
import Box from '@components/Box'
import RightArrow from '@assets/images/rightArrow.svg'
import TouchableContainer from '@components/TouchableContainer'
import CarotRight from '@assets/images/carot-right.svg'
import Config from 'react-native-config'
import { useHotspotOnboarding } from '../..'

const MOCK = Config.MOCK_IOT === 'true'

const WifiSettings = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const [networks, setNetworks] = useState<string[]>()
  const [configuredNetworks, setConfiguredNetworks] = useState<string[]>()
  const [connected, setConnected] = useState(false)

  const { isConnected, readWifiNetworks, removeConfiguredWifi } =
    useHotspotBle()
  const { carouselRef, setOnboardDetails } = useHotspotOnboarding()

  useEffect(() => {
    isConnected().then(setConnected)
  }, [isConnected])

  const {
    execute: handleRefresh,
    loading: refreshing,
    error,
  } = useAsyncCallback(async () => {
    if (MOCK) {
      setConfiguredNetworks(['Solana-House-5678'])
      setNetworks(['Helium-House-1234'])
      return
    }

    if (!connected) return

    const configured = await readWifiNetworks(true)
    setConfiguredNetworks(configured)
    const available = await readWifiNetworks(false)
    setNetworks(available)
  })

  // Refresh on network change or on load
  useEffect(() => {
    handleRefresh()
  }, [handleRefresh, connected])

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
          setOnboardDetails((o) => ({
            ...o,
            iotDetails: {
              ...o.iotDetails,
              network,
            },
          }))
          carouselRef?.current?.snapToNext()
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
    [
      configuredNetworks,
      readWifiNetworks,
      removeConfiguredWifi,
      t,
      carouselRef,
      setOnboardDetails,
    ],
  )

  const data = useMemo(
    () => [...(configuredNetworks || []), ...(networks || [])],
    [configuredNetworks, networks],
  )

  const renderItem = useCallback(
    ({
      item: network,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: string
      // eslint-disable-next-line react/no-unused-prop-types
    }) => {
      const first = data[0] === network
      const last = data[data.length - 1] === network
      const borderTopStartRadius = first ? '2xl' : 'none'
      const borderBottomStartRadius = last ? '2xl' : 'none'
      const borderBottomEndRadius = last ? '2xl' : 'none'
      const borderTopEndRadius = first ? '2xl' : 'none'

      return (
        <TouchableContainer
          alignItems="center"
          paddingVertical="xl"
          paddingStart="xl"
          paddingEnd="3xl"
          flexDirection="row"
          onPress={handleNetworkSelected({
            network,
            type: configuredNetworks?.includes(network)
              ? 'configured'
              : 'available',
          })}
          borderTopStartRadius={borderTopStartRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          borderTopEndRadius={borderTopEndRadius}
          marginBottom={last ? '2xl' : '0.5'}
        >
          <Text color="secondaryText" variant="textMdSemibold" flex={1}>
            {network}
          </Text>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
      )
    },
    [handleNetworkSelected, data, colors, configuredNetworks],
  )

  const keyExtractor = useCallback((name: string) => name, [])

  const renderHeader = useCallback(
    () => (
      <Box gap="2.5" marginBottom="2xl">
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('hotspotOnboarding.wifiSettings.title')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('hotspotOnboarding.wifiSettings.subtitle')}
        </Text>
        {error && (
          <Text variant="textMdMedium" color="error.500">
            {error.message ? error.message.toString() : error.toString()}
          </Text>
        )}
      </Box>
    ),
    [error, t],
  )

  const renderFooter = useCallback(
    () => (
      <TouchableOpacityBox
        onPress={handleRefresh}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap="1.5"
      >
        <Text
          variant="textMdMedium"
          textAlign="center"
          color="text.quaternary-500"
        >
          {refreshing
            ? t('hotspotOnboarding.scan.stop')
            : t('hotspotOnboarding.scan.start')}
        </Text>
        <RightArrow color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
    ),
    [colors, handleRefresh, refreshing, t],
  )

  const contentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      flex: 1,
    }),
    [spacing],
  )

  const flatListContentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
    }),
    [spacing],
  )

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={refreshing}
          onRefresh={handleRefresh}
          title=""
          tintColor={colors.primaryText}
        />
      }
    >
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={
          flatListContentContainerStyle as StyleProp<ViewStyle>
        }
      />
    </ScrollBox>
  )
}

export default WifiSettings
