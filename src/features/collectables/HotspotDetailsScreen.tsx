import React, { useCallback, useMemo, useState, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { PublicKey } from '@solana/web3.js'
import Menu from '@assets/images/menu.svg'
import InfoIcon from '@assets/images/info.svg'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import ButtonPressable from '../../components/ButtonPressable'
import Text from '../../components/Text'
import { ww } from '../../utils/layout'
import BackScreen from '../../components/BackScreen'
import { useSpacing } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import BlurActionSheet from '../../components/BlurActionSheet'
import ListItem from '../../components/ListItem'
import { useHotspot } from '../../hooks/useHotspot'
import { ReAnimatedBox } from '../../components/AnimatedBox'

type Route = RouteProp<CollectableStackParamList, 'HotspotDetailsScreen'>

const HotspotDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [optionsOpen, setOptionsOpen] = useState(false)

  const { t } = useTranslation()

  const { collectable } = route.params
  const mint = useMemo(
    () => new PublicKey(collectable.compression.asset_hash),
    [collectable.compression.asset_hash],
  )

  const {
    pendingMobileRewards,
    mobileRewardsLoading,
    pendingIotRewards,
    iotRewardsLoading,
    iotRewardsError,
    mobileRewardsError,
  } = useHotspot(mint)

  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards > 0,
    [pendingMobileRewards],
  )

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards > 0,
    [pendingIotRewards],
  )

  const spacing = useSpacing()

  const toggleFiltersOpen = useCallback(
    (open) => () => {
      setOptionsOpen(open)
    },
    [],
  )

  const handleSend = useCallback(() => {
    setOptionsOpen(false)
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const handleClaimRewards = useCallback(() => {
    navigation.navigate('ClaimRewardsScreen', {
      hotspot: collectable,
    })
  }, [collectable, navigation])

  const handleInfoPress = useCallback(() => {
    if (collectable.content?.metadata) {
      navigation.push('NftMetadataScreen', {
        metadata: collectable.content.metadata,
      })
    }
  }, [collectable.content.metadata, navigation])

  const hotspotOptions = useCallback(
    () => (
      <>
        <ListItem
          key="transfer"
          title="Transfer"
          onPress={handleSend}
          selected={false}
          hasPressedState={false}
        />
      </>
    ),
    [handleSend],
  )

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title={t('collectablesScreen.hotspots.hotspotDetailTitle')}
        backgroundImageUri={collectable.content?.metadata?.image || ''}
        edges={backEdges}
        TrailingIcon={InfoIcon}
        onTrailingIconPress={handleInfoPress}
      >
        <ScrollView>
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="m"
            alignItems="center"
          >
            <Box
              shadowColor="black"
              shadowOpacity={0.4}
              shadowOffset={{ width: 0, height: 10 }}
              shadowRadius={10}
              elevation={12}
            >
              <ImageBox
                marginTop="l"
                backgroundColor={
                  !collectable?.content.metadata?.image
                    ? 'surfaceSecondary'
                    : 'black'
                }
                height={COLLECTABLE_HEIGHT - spacing.xl * 2}
                width={COLLECTABLE_HEIGHT - spacing.xl * 2}
                source={{
                  uri: collectable?.content.metadata?.image,
                  cache: 'force-cache',
                }}
                borderRadius="xxl"
              />
            </Box>
            <Text
              marginTop="l"
              marginBottom="s"
              marginHorizontal="l"
              textAlign="center"
              variant="h1Medium"
            >
              {removeDashAndCapitalize(
                collectable.content?.metadata?.name || '',
              )}
            </Text>
            <Text variant="body3Medium" color="grey600" marginBottom="xl">
              {collectable.content?.metadata?.description ||
                t('collectablesScreen.collectables.noDescription')}
            </Text>
            <Box
              flexDirection="row"
              marginBottom="xl"
              marginTop="m"
              marginHorizontal="xl"
            >
              <TouchableOpacityBox
                height={65}
                width={65}
                backgroundColor="transparent10"
                borderRadius="round"
                justifyContent="center"
                alignItems="center"
                marginEnd="s"
                onPress={toggleFiltersOpen(true)}
              >
                <Menu />
              </TouchableOpacityBox>
              <ButtonPressable
                height={65}
                flexGrow={1}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                titleColorDisabled="grey600"
                title={t('collectablesScreen.hotspots.claimRewards')}
                titleColor="black"
                disabled={
                  !mobileRewardsLoading ||
                  !iotRewardsLoading ||
                  !!iotRewardsError ||
                  !!mobileRewardsError ||
                  !hasMobileRewards ||
                  !hasIotRewards
                }
                onPress={handleClaimRewards}
              />
            </Box>
            <Text marginBottom="s" variant="body2" color="grey600">
              {t('collectablesScreen.hotspots.pendingRewardsTitle')}
            </Text>
            <Text variant="body2" marginBottom="m">
              {t('collectablesScreen.hotspots.pendingRewards', {
                amount: pendingMobileRewards || 0,
                ticker: 'MOBILE',
              })}
            </Text>
            <Text variant="body2" marginBottom="m">
              {t('collectablesScreen.hotspots.pendingRewards', {
                amount: pendingIotRewards || 0,
                ticker: 'IOT',
              })}
            </Text>
            <BlurActionSheet
              title={t('collectablesScreen.hotspots.hotspotActions')}
              open={optionsOpen}
              onClose={toggleFiltersOpen(false)}
            >
              {hotspotOptions()}
            </BlurActionSheet>
          </SafeAreaBox>
        </ScrollView>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(HotspotDetailsScreen)
