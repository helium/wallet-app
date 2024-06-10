import CopyAddress from '@assets/images/copyAddress.svg'
import Hex from '@assets/images/hex.svg'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import ImageBox from '@components/ImageBox'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { makerApprovalKey } from '@helium/helium-entity-manager-sdk'
import { useMint } from '@helium/helium-react-hooks'
import { NetworkType } from '@helium/onboarding'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import useCopyText from '@hooks/useCopyText'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useEntityKey } from '@hooks/useEntityKey'
import { getExplorerUrl, useExplorer } from '@hooks/useExplorer'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { useHotspotWithMetaAndRewards } from '@hooks/useHotspotWithMeta'
import { IotHotspotInfoV0, useIotInfo } from '@hooks/useIotInfo'
import { useKeyToAssetForHotspot } from '@hooks/useKeyToAssetForHotspot'
import { useMaker } from '@hooks/useMaker'
import { useMakerApproval } from '@hooks/useMakerApproval'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { MobileHotspotInfoV0, useMobileInfo } from '@hooks/useMobileInfo'
import { usePublicKey } from '@hooks/usePublicKey'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useColors, useOpacity } from '@theme/themeHooks'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import { removeDashAndCapitalize } from '@utils/hotspotNftsUtils'
import { Explorer } from '@utils/walletApiV2'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert, AlertButton, Linking } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { useSolana } from '../../solana/SolanaProvider'
import { CompressedNFT } from '../../types/solana'
import { IOT_CONFIG_KEY, MOBILE_CONFIG_KEY, Mints } from '../../utils/constants'
import { CollectableNavigationProp } from './collectablesTypes'

const IotMapDetails = ({
  maker,
  info,
}: {
  maker: string
  info: IotHotspotInfoV0
}) => {
  const { t } = useTranslation()
  const colors = useColors()
  const { gain, elevation } = info

  return (
    <Box flexDirection="row" marginTop="m">
      <Box flex={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text variant="body2Medium">
            {t('collectablesScreen.hotspots.map.transmitScale')}
          </Text>
          <Box flexDirection="row" alignItems="center">
            <Hex width={16} height={16} color={colors.darkGrey} />
            <Text marginLeft="s" variant="body3">
              ---
            </Text>
          </Box>
        </Box>
        <Box>
          <Text variant="body2Medium" adjustsFontSizeToFit numberOfLines={1}>
            {t('generic.maker')}
          </Text>
          <Text variant="body3" numberOfLines={1}>
            {maker}
          </Text>
        </Box>
        <Box>
          <Text variant="body2Medium" adjustsFontSizeToFit numberOfLines={1}>
            {t('generic.gain')}
          </Text>
          <Text variant="body3">
            {gain ? gain / 10 : gain} {t('generic.dBi')}
          </Text>
        </Box>
        <Box>
          <Text variant="body2Medium" adjustsFontSizeToFit numberOfLines={1}>
            {t('generic.elevation')}
          </Text>
          <Text variant="body3">{elevation}m</Text>
        </Box>
      </Box>
    </Box>
  )
}

const MobileMapDetails = ({
  maker,
  info,
}: {
  maker: string
  info: MobileHotspotInfoV0
}) => {
  const { t } = useTranslation()
  const colors = useColors()
  const { deviceType } = info

  return (
    <Box flexDirection="row" marginTop="m">
      <Box flex={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text variant="body2Medium">{t('generic.coverage')}</Text>
          <Box flexDirection="row" alignItems="center">
            <Hex width={16} height={16} color={colors.darkGrey} />
            <Text marginLeft="s" variant="body3">
              ---
            </Text>
          </Box>
        </Box>
        <Box>
          <Text variant="body2Medium">{t('generic.maker')}</Text>
          <Text variant="body3">{maker}</Text>
        </Box>
        <Box>
          <Text variant="body2Medium">{t('generic.radioType')}</Text>
          <Text variant="body3">
            {deviceType ? Object.keys(deviceType)[0] : '---'}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}

export const HotspotMapHotspotDetails = ({
  hotspot,
  info,
  showActions,
  network,
}: {
  hotspot: CompressedNFT
  info?: IotHotspotInfoV0 | MobileHotspotInfoV0
  showActions: boolean
  network: NetworkType
}) => {
  const { t } = useTranslation()
  const colors = useColors()
  const wallet = useCurrentWallet()
  const navigation = useNavigation<CollectableNavigationProp>()
  const { anchorProvider } = useSolana()
  const { loading: loadingMeta, hotspotWithMeta } =
    useHotspotWithMetaAndRewards(hotspot)
  const entityKey = useEntityKey(hotspotWithMeta)
  const { info: kta } = useKeyToAssetForHotspot(hotspot)

  const [selectExplorerOpen, setSelectExplorerOpen] = useState(false)
  const streetAddress = useHotspotAddress(hotspotWithMeta)
  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)
  // Use entity key from kta since it's a buffer
  const iotInfoAcc = useIotInfo(kta?.entityKey)
  const mobileInfoAcc = useMobileInfo(kta?.entityKey)
  const { metadata } = hotspotWithMeta?.content || {}
  const copyText = useCopyText()
  const collection = hotspot.grouping.find(
    (k) => k.group_key === 'collection',
  )?.group_value
  const collectionKey = usePublicKey(collection)
  const { primaryText } = useColors()
  const { backgroundStyle: flamecoOpaque } = useOpacity('flamenco', 0.1)

  const { loading: mplxLoading, metadata: mplxMetadata } =
    useMetaplexMetadata(collectionKey)

  const {
    loading: explorerLoading,
    current: explorer,
    explorers: available,
    updateExplorer,
  } = useExplorer()

  const { loading: makerLoading, info: makerAcc } = useMaker(
    mplxMetadata?.updateAuthority.toBase58(),
  )

  const [iotMakerApproval, mobileMakerApproval] = useMemo(() => {
    if (!mplxMetadata) {
      return [undefined, undefined]
    }

    return [
      makerApprovalKey(IOT_CONFIG_KEY, mplxMetadata.updateAuthority)[0],
      makerApprovalKey(MOBILE_CONFIG_KEY, mplxMetadata.updateAuthority)[0],
    ]
  }, [mplxMetadata])

  const { info: iotMakerApprovalAcc } = useMakerApproval(iotMakerApproval)
  const { info: mobileMakerApprovalAcc } = useMakerApproval(mobileMakerApproval)

  // Need to repair this hotspot if it is missing an info struct but the maker
  // has approval for that subnetwork.
  const needsRepair =
    (iotMakerApprovalAcc && !iotInfoAcc?.info) ||
    (mobileMakerApprovalAcc && !mobileInfoAcc?.info)

  const pendingIotRewards = useMemo(
    () =>
      hotspotWithMeta?.pendingRewards &&
      new BN(hotspotWithMeta?.pendingRewards[Mints.IOT]),
    [hotspotWithMeta],
  )

  const pendingIotRewardsString = useMemo(() => {
    if (!hotspotWithMeta?.pendingRewards) return
    const num = toNumber(
      new BN(hotspotWithMeta?.pendingRewards[Mints.IOT]),
      iotMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspotWithMeta, iotMint])

  const pendingMobileRewards = useMemo(
    () =>
      hotspotWithMeta?.pendingRewards &&
      new BN(hotspotWithMeta?.pendingRewards[Mints.MOBILE]),
    [hotspotWithMeta],
  )

  const pendingMobileRewardsString = useMemo(() => {
    if (!hotspotWithMeta?.pendingRewards) return
    const num = toNumber(
      new BN(hotspotWithMeta?.pendingRewards[Mints.MOBILE]),
      mobileMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspotWithMeta, mobileMint])

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards.gt(new BN(0)),
    [pendingIotRewards],
  )
  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards.gt(new BN(0)),
    [pendingMobileRewards],
  )

  const hasRewards = useMemo(
    () => hasIotRewards || hasMobileRewards,
    [hasIotRewards, hasMobileRewards],
  )

  const mobileRecipient = useMemo(
    () => hotspotWithMeta?.rewardRecipients?.[Mints.MOBILE],
    [hotspotWithMeta],
  )

  const iotRecipient = useMemo(
    () => hotspotWithMeta?.rewardRecipients?.[Mints.IOT],
    [hotspotWithMeta],
  )

  const hasIotRecipient = useMemo(
    () =>
      iotRecipient?.destination &&
      wallet &&
      !new PublicKey(iotRecipient.destination).equals(wallet) &&
      !new PublicKey(iotRecipient.destination).equals(PublicKey.default),
    [iotRecipient, wallet],
  )

  const hasMobileRecipient = useMemo(
    () =>
      mobileRecipient?.destination &&
      wallet &&
      !new PublicKey(mobileRecipient.destination).equals(wallet) &&
      !new PublicKey(mobileRecipient.destination).equals(PublicKey.default),
    [mobileRecipient, wallet],
  )

  const hasRecipientSet = useMemo(
    () => hasIotRecipient || hasMobileRecipient,
    [hasIotRecipient, hasMobileRecipient],
  )

  const isLoading = useMemo(
    () => mplxLoading || explorerLoading || makerLoading || loadingMeta,
    [mplxLoading, explorerLoading, makerLoading, loadingMeta],
  )

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attr: any) => attr?.trait_type === 'ecc_compact',
    )?.value
  }, [metadata])

  useEffect(() => {
    if (explorer) {
      setSelectExplorerOpen(false)
    }
  }, [explorer])

  const handleCopyAddress = useCallback(() => {
    if (!eccCompact) return

    copyText({
      message: ellipsizeAddress(eccCompact),
      copyText: eccCompact,
    })
  }, [copyText, eccCompact])

  const handleViewInExplorer = useCallback(async () => {
    if (explorer && entityKey) {
      const url = getExplorerUrl({ entityKey, explorer })
      await Linking.openURL(url)
    } else if (entityKey) {
      setSelectExplorerOpen(true)
    }
  }, [explorer, entityKey, setSelectExplorerOpen])

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
    },
    [available, entityKey, updateExplorer],
  )

  const handleClaimRewards = useCallback(() => {
    if (hotspotWithMeta) {
      navigation.navigate('ClaimRewardsScreen', {
        hotspot: hotspotWithMeta,
      })
    }
  }, [hotspotWithMeta, navigation])

  const handleTransfer = useCallback(() => {
    navigation.navigate('TransferCollectableScreen', {
      collectable: hotspot,
    })
  }, [hotspot, navigation])

  const handleRecipientChange = useCallback(() => {
    if (hotspotWithMeta) {
      navigation.navigate('ChangeRewardsRecipientScreen', {
        hotspot: hotspotWithMeta,
      })
    }
  }, [hotspotWithMeta, navigation])

  const handleAssertLocation = useCallback(() => {
    if (hotspotWithMeta) {
      navigation.navigate('AssertLocationScreen', {
        collectable: hotspotWithMeta,
      })
    }
  }, [hotspotWithMeta, navigation])

  const handleAntennaSetup = useCallback(() => {
    if (hotspotWithMeta) {
      navigation.navigate('AntennaSetupScreen', {
        collectable: hotspotWithMeta,
      })
    }
  }, [hotspotWithMeta, navigation])

  const {
    execute: handleOnboard,
    loading: onboardLoading,
    error: onboardError,
  } = useAsyncCallback(async () => {
    if (!anchorProvider || !entityKey) {
      return
    }

    const networkType: NetworkType | undefined = await new Promise(
      (resolve) => {
        const options: AlertButton[] = []

        if (iotMakerApprovalAcc && !iotInfoAcc?.info) {
          options.push({
            text: 'IOT',
            onPress: () => {
              resolve('IOT')
            },
          })
        }

        if (mobileMakerApprovalAcc && !mobileInfoAcc?.info) {
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
      },
    )

    if (!networkType) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    navigation.push('OnboardingNavigator', {
      screen: 'IotBle',
      params: {
        screen: 'AddGatewayBle',
        params: {
          network: networkType,
          onboardingAddress: entityKey,
        },
      },
    })
  })

  return (
    <>
      <Box padding="ms" borderBottomColor="black900" borderBottomWidth={1}>
        {isLoading && (
          <Box
            flexDirection="row"
            minHeight={110}
            justifyContent="center"
            alignContent="center"
          >
            <Box justifyContent="center">
              <CircleLoader loaderSize={24} color="white" />
            </Box>
          </Box>
        )}
        {!isLoading && (
          <>
            <Box flexDirection="row">
              <ImageBox
                borderRadius="lm"
                height={60}
                width={60}
                mr="ms"
                source={{
                  uri: metadata?.image,
                  cache: 'force-cache',
                }}
              />
              <Box flex={1}>
                <Box flexDirection="row" alignItems="center">
                  <Box flex={1} flexDirection="row">
                    <Text
                      variant="h3Bold"
                      color="white"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {removeDashAndCapitalize(hotspot.content.metadata.name)}
                    </Text>
                  </Box>
                </Box>
                <Box flex={1} flexDirection="row" alignItems="center">
                  {streetAddress && (
                    <>
                      <Box flexShrink={1} flexDirection="row">
                        <Text numberOfLines={1} variant="body1">
                          {streetAddress}
                        </Text>
                      </Box>
                      <Box
                        backgroundColor="surfaceContrast"
                        height={6}
                        width={6}
                        borderRadius="round"
                        marginHorizontal="ms"
                      />
                    </>
                  )}
                  {eccCompact && (
                    <TouchableOpacityBox
                      flexDirection="row"
                      alignItems="center"
                      onPress={handleCopyAddress}
                    >
                      <Text variant="body1" numberOfLines={1} marginRight="xs">
                        {ellipsizeAddress(eccCompact, { numChars: 4 })}
                      </Text>
                      <CopyAddress width={16} height={16} color={primaryText} />
                    </TouchableOpacityBox>
                  )}
                </Box>
              </Box>
            </Box>
            {network === 'IOT' && info && (
              <IotMapDetails
                maker={makerAcc?.name || 'Unknown'}
                info={info as IotHotspotInfoV0}
              />
            )}
            {network === 'MOBILE' && info && (
              <MobileMapDetails
                maker={makerAcc?.name || 'Unknown'}
                info={info as MobileHotspotInfoV0}
              />
            )}
            {onboardError && (
              <Box
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                paddingTop="ms"
              >
                <Text variant="body3Medium" color="red500">
                  {onboardError.toString()}
                </Text>
              </Box>
            )}
          </>
        )}
      </Box>

      {showActions && (
        <Box position="relative">
          <ReAnimatedBlurBox
            visible={onboardLoading}
            exiting={DelayedFadeIn}
            position="absolute"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            zIndex={100}
          >
            <CircleLoader loaderSize={24} color="white" />
          </ReAnimatedBlurBox>
          {selectExplorerOpen ? (
            <>
              <Box
                borderBottomColor="black900"
                padding="m"
                borderBottomWidth={1}
              >
                <Text variant="subtitle1">
                  {t('activityScreen.selectExplorer')}
                </Text>

                <Text variant="body2">
                  {t('activityScreen.selectExplorerSubtitle')}
                </Text>
              </Box>

              {available?.map((a) => {
                return (
                  <ListItem
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
          ) : (
            <>
              <TouchableOpacityBox
                paddingVertical="m"
                borderBottomColor="black900"
                borderBottomWidth={1}
                onPress={hasRewards ? handleClaimRewards : undefined}
                disabled={!hasRewards}
              >
                <Box
                  flex={1}
                  flexDirection="row"
                  alignItems="center"
                  marginHorizontal="m"
                >
                  <Text variant="subtitle3" opacity={!hasRewards ? 0.5 : 1}>
                    {t('collectablesScreen.hotspots.claimRewards')}
                  </Text>
                  <Box
                    flex={1}
                    flexDirection="row"
                    justifyContent="flex-end"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    gap={4}
                  >
                    {!!hasMobileRewards && (
                      <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        backgroundColor="mobileDarkBlue"
                        borderRadius="m"
                        paddingVertical="xs"
                        paddingLeft="xs"
                        paddingRight="s"
                      >
                        <MobileSymbol
                          color={colors.mobileBlue}
                          width={20}
                          height={20}
                        />
                        <Text
                          variant="body3Medium"
                          marginLeft="s"
                          color="mobileBlue"
                        >
                          {pendingMobileRewardsString}
                        </Text>
                      </Box>
                    )}
                    {!!hasIotRewards && (
                      <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        backgroundColor="iotDarkGreen"
                        borderRadius="m"
                        paddingVertical="xs"
                        paddingLeft="xs"
                        paddingRight="s"
                      >
                        <IotSymbol
                          color={colors.iotGreen}
                          width={20}
                          height={20}
                        />
                        <Text
                          variant="body3Medium"
                          marginLeft="s"
                          color="iotGreen"
                        >
                          {pendingIotRewardsString}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              </TouchableOpacityBox>
              <TouchableOpacityBox
                paddingVertical="m"
                borderBottomColor="black900"
                borderBottomWidth={1}
                onPress={handleRecipientChange}
              >
                <Box
                  flex={1}
                  flexDirection="row"
                  alignItems="center"
                  marginHorizontal="m"
                  justifyContent="space-between"
                >
                  <Text variant="subtitle3">
                    {t('changeRewardsRecipientScreen.title')}
                  </Text>
                  {hasRecipientSet && (
                    <Box flexDirection="row" alignItems="center">
                      <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        borderRadius="m"
                        paddingVertical="sx"
                        paddingLeft="s"
                        paddingRight="s"
                        style={{
                          ...flamecoOpaque,
                        }}
                      >
                        <Text variant="body3Medium" color="flamenco">
                          {t('changeRewardsRecipientScreen.set')}
                        </Text>
                      </Box>
                    </Box>
                  )}
                </Box>
              </TouchableOpacityBox>
              <ListItem
                title={t('collectablesScreen.hotspots.viewInExplorer')}
                onPress={handleViewInExplorer}
                selected={false}
                hasPressedState={false}
              />
              <ListItem
                title={t('collectablesScreen.hotspots.transferHotspot')}
                onPress={handleTransfer}
                selected={false}
                hasPressedState={false}
              />
              <ListItem
                title={t('collectablesScreen.hotspots.assertLocation')}
                onPress={handleAssertLocation}
                selected={false}
                hasPressedState={false}
              />
              {network === 'IOT' && (
                <ListItem
                  title={t('collectablesScreen.hotspots.antennaSetup')}
                  onPress={handleAntennaSetup}
                  selected={false}
                  hasPressedState={false}
                />
              )}
              {needsRepair && (
                <ListItem
                  key="onboard"
                  disabled
                  title={t('collectablesScreen.hotspots.onboard.title')}
                  onPress={handleOnboard}
                  selected={false}
                  hasPressedState={false}
                />
              )}
            </>
          )}
        </Box>
      )}
    </>
  )
}
