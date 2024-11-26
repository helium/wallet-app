import Box from '@components/Box'
import ScrollBox from '@components/ScrollBox'
import React, { useCallback, useMemo } from 'react'
import { useBorderRadii, useColors, useSpacing } from '@config/theme/themeHooks'
import Crown from '@assets/svgs/crown.svg'
import Text from '@components/Text'
import MapPin from '@assets/svgs/mapPin.svg'
import Hex from '@assets/svgs/hex.svg'
import Clock from '@assets/svgs/clock.svg'
import Person from '@assets/svgs/person.svg'
import Electricity from '@assets/svgs/electricity.svg'
import FabButton from '@components/FabButton'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useMaker } from '@hooks/useMaker'
import MakerHotspotImage from '@components/MakerHotspotImage'
import { getAddressFromLatLng } from '@utils/location'
import { useAsync } from 'react-async-hook'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import MiniMap from '@components/MiniMap'
import { HotspotNavigationProp } from '@services/HotspotService/pages/HotspotPage'
import { HotspotWithPendingRewards } from '../../types/solana'

const MINI_MAP_HEIGHT = 310

const HotspotDetails = () => {
  const { t } = useTranslation()
  const { hotspot } = useRoute().params as {
    hotspot: HotspotWithPendingRewards
  }
  const spacing = useSpacing()
  const navigation = useNavigation<HotspotNavigationProp>()

  const colors = useColors()
  const borderRadii = useBorderRadii()

  const onBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const collectionKey = useMemo(() => {
    return new PublicKey(
      hotspot.grouping.find((g) => g.group_key === 'collection')?.group_value,
    )
  }, [hotspot])

  const subDao = useMemo(() => {
    if (hotspot?.content?.metadata?.hotspot_infos?.iot?.device_type) {
      return 'iot'
    }

    if (hotspot?.content?.metadata?.hotspot_infos?.mobile?.device_type) {
      return 'mobile'
    }

    return 'iot'
  }, [hotspot])

  const { result: hotspotAddress } = useAsync(async () => {
    const subDaoInfo = hotspot?.content?.metadata?.hotspot_infos[subDao]

    const lat = subDaoInfo?.lat
    const long = subDaoInfo?.long

    const address = await getAddressFromLatLng(lat, long)

    return `${address.street}, ${address.city}, ${address.state}`
  }, [hotspot, subDao])

  const onConfig = useCallback(() => {
    if (!hotspotAddress) return
    navigation.push('HotspotConfig', { hotspot, hotspotAddress })
  }, [navigation, hotspot, hotspotAddress])

  const deviceType = useMemo(() => {
    return hotspot?.content?.metadata?.hotspot_infos?.iot?.device_type
  }, [hotspot])

  const { metadata: mplxMetadata } = useMetaplexMetadata(collectionKey)

  const { info: makerAcc } = useMaker(mplxMetadata?.updateAuthority.toBase58())

  const HeaderButtons = useCallback(() => {
    return (
      <Box
        flexDirection="row"
        justifyContent="space-between"
        position="absolute"
        top={spacing['4xl']}
        left={spacing['4xl']}
        right={spacing['4xl']}
        zIndex={1000}
      >
        <FabButton
          icon="arrowLeft"
          size={50}
          backgroundColor="primaryText"
          iconColor="primaryBackground"
          onPress={onBack}
        />
        <FabButton
          icon="settings"
          size={50}
          backgroundColor="primaryText"
          iconColor="primaryBackground"
          onPress={onConfig}
        />
      </Box>
    )
  }, [onBack, spacing, onConfig])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const LevelBadge = useCallback(() => {
    return (
      <Box
        paddingHorizontal="2.5"
        paddingVertical="1.5"
        backgroundColor="purple.500"
        borderRadius="full"
        flexDirection="row"
        gap="2"
        alignItems="center"
      >
        <Crown />
        <Text variant="textSmSemibold" color="primaryBackground">
          Level 15
        </Text>
      </Box>
    )
  }, [])

  const deployedDate = useMemo(() => {
    const subDaoInfo = hotspot?.content?.metadata?.hotspot_infos[subDao]

    const date = new Date(subDaoInfo?.created_at)

    return t('HotspotDetails.deployed', {
      date: formatDistanceToNow(date, { addSuffix: true }),
    })
  }, [hotspot, subDao, t])

  const coordinates = useMemo(() => {
    const subDaoInfo = hotspot?.content?.metadata?.hotspot_infos[subDao]

    return [subDaoInfo?.lat, subDaoInfo?.long]
  }, [hotspot, subDao])

  const HotspotMetaLineItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ type, label }: { type: string; label: string | undefined }) => {
      let Icon = MapPin
      switch (type) {
        default:
        case 'mapPin':
          Icon = MapPin
          break
        case 'hex':
          Icon = Hex
          break
        case 'clock':
          Icon = Clock
          break
        case 'person':
          Icon = Person
          break
        case 'electricity':
          Icon = Electricity
          break
      }

      const iconColor = colors['blue.dark-500']

      return (
        <Box gap="sm" flexDirection="row">
          <Icon color={iconColor} />
          {label ? (
            <Text variant="textMdRegular" color="primaryText">
              {label}
            </Text>
          ) : (
            <SkeletonPlaceholder
              backgroundColor={colors['text.placeholder-subtle']}
              highlightColor={colors.cardBackground}
            >
              <SkeletonPlaceholder.Item
                width={300}
                height={20}
                borderRadius={borderRadii.sm}
              />
            </SkeletonPlaceholder>
          )}
        </Box>
      )
    },
    [colors, borderRadii],
  )

  return (
    <ScrollBox contentContainerStyle={{ padding: spacing['2xl'] }}>
      <HeaderButtons />
      <MiniMap
        hasExpandButton={false}
        height={MINI_MAP_HEIGHT}
        lat={coordinates?.[0]}
        long={coordinates?.[1]}
      />
      <Box
        position="absolute"
        top={MINI_MAP_HEIGHT - 86}
        left={0}
        right={0}
        height={86}
        alignItems="center"
      >
        <MakerHotspotImage
          maker={makerAcc?.name}
          subDao={subDao}
          deviceType={deviceType}
        />
      </Box>
      <Box alignItems="center" style={{ marginTop: 86 + spacing.xl }}>
        {/* 
        TODO: Add level badge
        <LevelBadge /> */}
      </Box>
      <Text
        variant="displayMdSemibold"
        color="primaryText"
        textAlign="center"
        marginTop="md"
        marginBottom="3xl"
        marginHorizontal="2xl"
      >
        {hotspot?.content?.metadata?.name}
      </Text>

      <Box gap="2.5">
        <HotspotMetaLineItem type="mapPin" label={hotspotAddress} />
        <HotspotMetaLineItem
          type="hex"
          label={
            subDao === 'iot'
              ? t('HotspotDetails.heliumIoTHotspot')
              : t('HotspotDetails.heliumMobileHotspot')
          }
        />
        <HotspotMetaLineItem type="clock" label={deployedDate} />
        {/* <HotspotMetaLineItem type="person" label="6d69...f44d" />
        <HotspotMetaLineItem type="electricity" label="89.3" /> */}
      </Box>
    </ScrollBox>
  )
}

export default HotspotDetails
