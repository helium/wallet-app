import Box from '@components/Box'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import { useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useMemo } from 'react'
import ScrollBox from '@components/ScrollBox'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import { FlatList } from 'react-native'
import TouchableContainer from '@components/TouchableContainer'
import useCopyText from '@hooks/useCopyText'
import useHaptic from '@hooks/useHaptic'
import { ellipsizeAddress } from '@utils/accountUtils'
import CarotRight from '@assets/svgs/carot-right.svg'
import { HotspotNavigationProp } from '@services/HotspotService/pages/HotspotPage'
import { HotspotWithPendingRewards } from '../../types/solana'

type HotspotConfigItem = {
  title: string
  subtitle?: string
  onPress: () => void
}

export const HotspotConfig = () => {
  const { hotspot, hotspotAddress } = useRoute().params as {
    hotspot: HotspotWithPendingRewards
    hotspotAddress: string
  }

  const isIotHotspot = useMemo(() => {
    return (
      hotspot?.content?.metadata?.hotspot_infos?.iot?.device_type ||
      !hotspot?.content?.metadata?.hotspot_infos?.mobile?.device_type
    )
  }, [hotspot])

  const spacing = useSpacing()
  const colors = useColors()
  const navigation = useNavigation<HotspotNavigationProp>()
  const copyText = useCopyText()
  const { triggerImpact } = useHaptic()

  const data = useMemo(() => {
    return [
      {
        title: 'Update Location',
        subtitle: hotspotAddress,
        Icon: undefined,
        onPress: () => {
          navigation.navigate('AssertLocationScreen', {
            collectable: hotspot,
          })
        },
      },
      {
        title: 'Update Rewards Recipient',
        subtitle: undefined,
        Icon: undefined,
        onPress: () => {
          navigation.navigate('ChangeRewardsRecipientScreen', {
            hotspot,
          })
        },
      },
      {
        title: 'Antenna Setup',
        subtitle: undefined,
        Icon: undefined,
        onPress: () => {
          navigation.navigate('AntennaSetupScreen', {
            collectable: hotspot,
          })
        },
      },
      {
        title: 'Transfer ownership',
        subtitle: undefined,
        onPress: () => {
          navigation.navigate('TransferCollectableScreen', {
            collectable: hotspot,
          })
        },
      },
      {
        title: 'Copy address',
        subtitle: undefined,
        onPress: () => {
          triggerImpact('light')
          copyText({
            message: ellipsizeAddress(hotspot?.id),
            copyText: hotspot?.id,
          })
        },
      },
      !isIotHotspot && {
        title: 'Reboot',
        subtitle: undefined,
        Icon: undefined,
        onPress: () => {},
      },
      isIotHotspot && {
        title: 'Diagnostics',
        subtitle: undefined,
        onPress: () => {
          navigation.navigate('DiagnosticsScreen', {
            collectable: hotspot,
          })
        },
      },
      isIotHotspot && {
        title: 'Setup Wifi',
        subtitle: undefined,
        onPress: () => {
          navigation.navigate('ModifyWifiScreen', {
            collectable: hotspot,
          })
        },
      },
    ].filter(Boolean) as HotspotConfigItem[]
  }, [
    copyText,
    hotspot,
    triggerImpact,
    navigation,
    hotspotAddress,
    isIotHotspot,
  ])

  const onBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const keyExtractor = useCallback((item: HotspotConfigItem) => item.title, [])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: HotspotConfigItem }) => {
      const isFirst = item.title === data[0].title
      const isLast = item.title === data[data.length - 1].title
      const borderTopStartRadius = isFirst ? '3xl' : undefined
      const borderTopEndRadius = isFirst ? '3xl' : undefined
      const borderBottomStartRadius = isLast ? '3xl' : undefined
      const borderBottomEndRadius = isLast ? '3xl' : undefined

      return (
        <TouchableContainer
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          marginBottom="xxs"
          onPress={item.onPress}
        >
          <Box padding="xl" gap="2.5" flexDirection="row">
            <Box flex={1} gap="1" justifyContent="center">
              <Text variant="textLgSemibold">{item.title}</Text>
              {item.subtitle && (
                <Text variant="textSmRegular" color="secondaryText">
                  {item.subtitle}
                </Text>
              )}
            </Box>

            <Box justifyContent="center">
              <CarotRight color={colors.secondaryText} />
            </Box>
          </Box>
        </TouchableContainer>
      )
    },
    [data, colors],
  )

  const contentContainerStyle = useMemo(() => {
    return {
      // paddingBottom: spacing['2xl'],
    }
  }, [])

  const renderHeader = useCallback(() => {
    return (
      <Box marginVertical="6xl">
        <FabButton
          icon="arrowLeft"
          size={50}
          backgroundColor="primaryText"
          iconColor="primaryBackground"
          onPress={onBack}
        />
      </Box>
    )
  }, [onBack])

  return (
    <ScrollBox contentContainerStyle={{ padding: spacing['2xl'] }}>
      <FlatList
        contentContainerStyle={contentContainerStyle}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
      />
    </ScrollBox>
  )
}

export default HotspotConfig
