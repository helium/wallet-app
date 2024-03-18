import InfoIcon from '@assets/images/info.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import ImageBox from '@components/ImageBox'
import ListItem from '@components/ListItem'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import {
  makerApprovalKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import { NetworkType } from '@helium/onboarding'
import { toNumber } from '@helium/spl-utils'
import useCopyText from '@hooks/useCopyText'
import { useEntityKey } from '@hooks/useEntityKey'
import { getExplorerUrl, useExplorer } from '@hooks/useExplorer'
import useHaptic from '@hooks/useHaptic'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { useIotInfo } from '@hooks/useIotInfo'
import { useMakerApproval } from '@hooks/useMakerApproval'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useMobileInfo } from '@hooks/useMobileInfo'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useSpacing } from '@theme/themeHooks'
import { ellipsizeAddress } from '@utils/accountUtils'
import { Explorer } from '@utils/walletApiV2'
import BN from 'bn.js'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert, AlertButton, Linking, ScrollView } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import { SvgUri } from 'react-native-svg'
import 'text-encoding-polyfill'
import { useSolana } from '../../solana/SolanaProvider'
import {
  IOT_SUB_DAO_KEY,
  MOBILE_SUB_DAO_KEY,
  Mints,
} from '../../utils/constants'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { ww } from '../../utils/layout'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<CollectableStackParamList, 'HotspotDetailsScreen'>
const [iotConfigKey] = rewardableEntityConfigKey(IOT_SUB_DAO_KEY, 'IOT')
const [mobileConfigKey] = rewardableEntityConfigKey(
  MOBILE_SUB_DAO_KEY,
  'MOBILE',
)

const HotspotDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [optionsOpen, setOptionsOpen] = useState(false)
  const { anchorProvider } = useSolana()

  const { t } = useTranslation()
  const { triggerImpact } = useHaptic()
  const copyText = useCopyText()

  const { collectable } = route.params
  const entityKey = useEntityKey(collectable)
  const iotInfoAcc = useIotInfo(entityKey)
  const mobileInfoAcc = useMobileInfo(entityKey)
  const streetAddress = useHotspotAddress(collectable)
  const collection = collectable.grouping.find(
    (k) => k.group_key === 'collection',
  )?.group_value
  const collectionKey = usePublicKey(collection)
  const { metadata } = useMetaplexMetadata(collectionKey)
  const [iotMakerApproval, mobileMakerApproval] = useMemo(() => {
    if (!metadata) {
      return [undefined, undefined]
    }

    return [
      makerApprovalKey(iotConfigKey, metadata.updateAuthority)[0],
      makerApprovalKey(mobileConfigKey, metadata.updateAuthority)[0],
    ]
  }, [metadata])

  const { info: iotMakerApprovalAcc } = useMakerApproval(iotMakerApproval)
  const { info: mobileMakerApprovalAcc } = useMakerApproval(mobileMakerApproval)
  // Need to repair this hotspot if it is missing an info struct but the maker
  // has approval for that subnetwork.
  const needsRepair =
    (iotMakerApprovalAcc && !iotInfoAcc?.info) ||
    (mobileMakerApprovalAcc && !mobileInfoAcc?.info)

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
      setSelectExplorerOpen(false)
    },
    [],
  )

  const handleSend = useCallback(() => {
    setOptionsOpen(false)
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const {
    current: explorer,
    explorers: available,
    updateExplorer,
  } = useExplorer()

  const [selectExplorerOpen, setSelectExplorerOpen] = useState(false)
  useEffect(() => {
    if (explorer) {
      setSelectExplorerOpen(false)
    }
  }, [explorer])
  const handleViewInExplorer = useCallback(async () => {
    if (explorer && entityKey) {
      const url = getExplorerUrl({ entityKey, explorer })
      await Linking.openURL(url)
    } else if (entityKey) {
      setSelectExplorerOpen(true)
    }
  }, [explorer, entityKey, setSelectExplorerOpen])

  const handleAntennaSetup = useCallback(() => {
    setOptionsOpen(false)
    navigation.navigate('AntennaSetupScreen', {
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
      (a: { [key: string]: string }) => a?.trait_type === 'ecc_compact',
    )

    if (!attribute?.value) return

    triggerImpact('light')
    copyText({
      message: ellipsizeAddress(attribute.value),
      copyText: attribute.value,
    })
    setOptionsOpen(false)
    setSelectExplorerOpen(false)
  }, [copyText, collectable, triggerImpact])

  const {
    execute: handleOnboard,
    loading,
    error,
  } = useAsyncCallback(async () => {
    if (!anchorProvider || !entityKey) {
      return
    }
    setOptionsOpen(false)
    const network: NetworkType | undefined = await new Promise((resolve) => {
      const options: AlertButton[] = []
      if (!iotInfoAcc?.info) {
        options.push({
          text: 'IOT',
          onPress: () => {
            resolve('IOT')
          },
        })
      }
      if (!mobileInfoAcc?.info) {
        options.push({
          text: 'MOBILE',
          onPress: () => {
            resolve('MOBILE')
          },
        })
      }
      options.push({
        text: t('generic.cancel'),
        style: 'destructive',
        onPress: () => {
          resolve(undefined)
        },
      })
      Alert.alert(
        t('collectablesScreen.hotspots.onboard.title'),
        t('collectablesScreen.hotspots.onboard.which'),
        options,
      )
    })
    if (!network) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    navigation.push('OnboardingNavigator', {
      screen: 'IotBle',
      params: {
        screen: 'AddGatewayBle',
        params: {
          network,
          onboardingAddress: entityKey,
        },
      },
    })
  })

  const handleConfirmExplorer = useCallback(
    async (selectedExplorer: string) => {
      await updateExplorer(selectedExplorer)

      const selected = available?.find(
        (a: Explorer) => a.value === selectedExplorer,
      )
      if (entityKey && selected) {
        const url = getExplorerUrl({
          entityKey,
          explorer: selected,
        })
        await Linking.openURL(url)
      }
      setOptionsOpen(false)
    },
    [available, entityKey, updateExplorer, setOptionsOpen],
  )
  const hotspotOptions = useCallback(() => {
    if (selectExplorerOpen) {
      return (
        <>
          <Box
            borderBottomColor="black900"
            paddingHorizontal="m"
            paddingBottom="m"
            borderBottomWidth={1}
          >
            <Text variant="h4">{t('activityScreen.selectExplorer')}</Text>

            <Text variant="body2">
              {t('activityScreen.selectExplorerSubtitle')}
            </Text>
          </Box>

          {available?.map((a) => {
            return (
              <ListItem
                paddingHorizontal="m"
                key={a.value}
                title={a.label}
                Icon={
                  a.image.endsWith('svg') ? (
                    <SvgUri height={16} width={16} uri={a.image} />
                  ) : (
                    <ImageBox
                      height={16}
                      width={16}
                      source={{ uri: a.image }}
                    />
                  )
                }
                onPress={() => handleConfirmExplorer(a.value)}
                selected={explorer?.value === a.value}
                hasPressedState={false}
              />
            )
          })}
        </>
      )
    }
    return (
      <>
        <ListItem
          key="explorer"
          title={t('collectablesScreen.hotspots.viewInExplorer')}
          onPress={handleViewInExplorer}
          selected={false}
          hasPressedState={false}
        />
        <ListItem
          key="transfer"
          title={t('collectablesScreen.hotspots.transferHotspot')}
          onPress={handleSend}
          selected={false}
          hasPressedState={false}
        />
        {iotInfoAcc?.info?.location && (
          <ListItem
            key="antennaSetup"
            title={t('collectablesScreen.hotspots.antennaSetup')}
            onPress={handleAntennaSetup}
            selected={false}
            hasPressedState={false}
          />
        )}
        <ListItem
          key="copyAddress"
          title={t('collectablesScreen.hotspots.copyEccCompact')}
          onPress={handleCopyAddress}
          selected={false}
          hasPressedState={false}
        />
        {needsRepair && (
          <ListItem
            key="onboard"
            title={t('collectablesScreen.hotspots.onboard.title')}
            onPress={handleOnboard}
            selected={false}
            hasPressedState={false}
          />
        )}
      </>
    )
  }, [
    selectExplorerOpen,
    t,
    handleViewInExplorer,
    handleSend,
    iotInfoAcc?.info?.location,
    handleAntennaSetup,
    handleCopyAddress,
    needsRepair,
    handleOnboard,
    available,
    explorer?.value,
    handleConfirmExplorer,
  ])

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
            {streetAddress && (
              <ReAnimatedBox entering={FadeIn}>
                <Text variant="body1" marginTop="l" textAlign="center">
                  {streetAddress || ' '}
                </Text>
              </ReAnimatedBox>
            )}
            {!streetAddress && (
              <Text variant="body1" marginTop="l" textAlign="center">
                {' '}
              </Text>
            )}
            <Box marginTop="m">
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
              {error && (
                <Text mb="s" variant="body2Medium" color="red500">
                  {error.toString()}
                </Text>
              )}
              <ButtonPressable
                height={65}
                flexGrow={1}
                flex={1}
                flexShrink={0}
                borderRadius="round"
                borderWidth={2}
                borderColor="white"
                backgroundColorOpacityPressed={0.7}
                disabled={loading}
                title={
                  loading ? undefined : t('collectablesScreen.hotspots.manage')
                }
                titleColor="white"
                titleColorPressed="black"
                onPress={toggleFiltersOpen(true)}
                TrailingComponent={
                  loading ? (
                    <CircleLoader loaderSize={20} color="white" />
                  ) : undefined
                }
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
