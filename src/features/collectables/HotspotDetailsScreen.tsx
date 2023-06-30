import React, { useCallback, useMemo, useState, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import InfoIcon from '@assets/images/info.svg'
import BN from 'bn.js'
import SafeAreaBox from '@components/SafeAreaBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import BackScreen from '@components/BackScreen'
import BlurActionSheet from '@components/BlurActionSheet'
import ListItem from '@components/ListItem'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { useSpacing } from '@theme/themeHooks'
import useHaptic from '@hooks/useHaptic'
import useCopyText from '@hooks/useCopyText'
import { ellipsizeAddress } from '@utils/accountUtils'
import { toNumber } from '@helium/spl-utils'
import { ww } from '../../utils/layout'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { Mints } from '../../utils/constants'

type Route = RouteProp<CollectableStackParamList, 'HotspotDetailsScreen'>
const HotspotDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [optionsOpen, setOptionsOpen] = useState(false)

  const { t } = useTranslation()
  const { triggerImpact } = useHaptic()
  const copyText = useCopyText()

  const { collectable } = route.params
  const pendingIotRewards =
    collectable &&
    collectable.pendingRewards &&
    new BN(collectable.pendingRewards[Mints.IOT])
  const pendingMobileRewards =
    collectable &&
    collectable.pendingRewards &&
    new BN(collectable.pendingRewards[Mints.MOBILE])

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

  const handleAssertLocation = useCallback(() => {
    setOptionsOpen(false)
    navigation.navigate('AssertLocationScreen', {
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

  const handleCopyAddress = useCallback(() => {
    if (!collectable?.content?.metadata) return

    const attribute = collectable?.content?.metadata.attributes?.find(
      (a) => a.trait_type === 'ecc_compact',
    )

    if (!attribute?.value) return

    triggerImpact('light')
    copyText({
      message: ellipsizeAddress(attribute.value),
      copyText: attribute.value,
    })
    setOptionsOpen(false)
  }, [copyText, collectable, triggerImpact])

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
        <ListItem
          key="assertLocation"
          title={t('collectablesScreen.hotspots.assertLocation')}
          onPress={handleAssertLocation}
          selected={false}
          hasPressedState={false}
        />
        <ListItem
          key="copyAddress"
          title={t('collectablesScreen.hotspots.copyEccCompact')}
          onPress={handleCopyAddress}
          selected={false}
          hasPressedState={false}
        />
      </>
    ),
    [handleSend, handleAssertLocation, handleCopyAddress, t],
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
          >
            <Text marginBottom="s" variant="h2Medium">
              {removeDashAndCapitalize(
                collectable.content?.metadata?.name || '',
              )}
            </Text>
            <Text variant="body3Medium" color="grey600">
              {collectable.content?.metadata?.description ||
                t('collectablesScreen.collectables.noDescription')}
            </Text>
            <Box
              shadowColor="black"
              shadowOpacity={0.4}
              shadowOffset={{ width: 0, height: 10 }}
              shadowRadius={10}
              elevation={12}
              alignItems="center"
              marginTop="m"
              padding="s"
              borderRadius="xxl"
              backgroundColor="surfaceSecondary"
            >
              <ImageBox
                height={COLLECTABLE_HEIGHT - spacing.xl * 6}
                width={COLLECTABLE_HEIGHT - spacing.xl * 6}
                source={{
                  uri: collectable?.content.metadata?.image,
                  cache: 'force-cache',
                }}
              />
            </Box>
            <Box marginTop="l" marginBottom="m">
              <Text variant="body1" marginBottom="ms">
                {t('collectablesScreen.hotspots.pendingRewardsTitle')}
              </Text>
              <Box flexDirection="row" marginBottom="m">
                <Box flex={1} justifyContent="center">
                  <Box>
                    <Text variant="body3" color="grey600">
                      MOBILE
                    </Text>
                    <Text variant="body2Medium">
                      {pendingMobileRewards
                        ? toNumber(pendingMobileRewards, 6)
                        : 0}
                    </Text>
                  </Box>
                </Box>
                <Box flex={1} justifyContent="center">
                  <Box>
                    <Text variant="body3" color="grey600">
                      IOT
                    </Text>
                    <Text variant="body2Medium">
                      {pendingIotRewards ? toNumber(pendingIotRewards, 6) : 0}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box>
              <ButtonPressable
                height={65}
                flexGrow={1}
                flex={1}
                flexShrink={0}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacity={0.4}
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                titleColorDisabled="secondaryText"
                title={t('collectablesScreen.hotspots.manage')}
                titleColor="black"
                onPress={toggleFiltersOpen(true)}
              />
              <Box paddingVertical="s" />
              <ButtonPressable
                height={65}
                flexGrow={1}
                flex={1}
                flexShrink={0}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="surfaceSecondary"
                backgroundColorDisabledOpacity={0.1}
                titleColorDisabled="secondaryText"
                title={t('collectablesScreen.hotspots.claimRewards')}
                titleColor="black"
                disabled={
                  pendingIotRewards &&
                  pendingIotRewards.eq(new BN(0)) &&
                  pendingMobileRewards &&
                  pendingMobileRewards.eq(new BN(0))
                }
                onPress={handleClaimRewards}
              />
            </Box>
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
