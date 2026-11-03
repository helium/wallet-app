import Hex from '@assets/images/hex.svg'
import HntSymbol from '@assets/images/hnt.svg'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { makerApprovalKey } from '@helium/helium-entity-manager-sdk'
import { useMint } from '@helium/helium-react-hooks'
import { NetworkType } from '@helium/onboarding'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
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
import { MobileHotspotInfoV0 } from '@hooks/useMobileInfo'
import { usePublicKey } from '@hooks/usePublicKey'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { FADE_OUT_STATE } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import { removeDashAndCapitalize } from '@utils/hotspotNftsUtils'
import { Explorer } from '@utils/walletApiV2'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { BlurView } from 'expo-blur'
import { CircleCheck, Copy } from 'lucide-react-native'
import React, { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'
import { Image } from '@ui/Image'
import Animated from 'react-native-reanimated'
import { SvgUri } from 'react-native-svg'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import { CompressedNFT } from '../../types/solana'
import { IOT_CONFIG_KEY, Mints } from '../../utils/constants'
import { CollectableNavigationProp } from './collectablesTypes'

const HexIcon = withUniwind(Hex)
const HntIcon = withUniwind(HntSymbol)
const MobileIcon = withUniwind(MobileSymbol)
const IotIcon = withUniwind(IotSymbol)
const CopyIcon = withUniwind(Copy)
const CheckIcon = withUniwind(CircleCheck)
const AnimatedBlurView = withUniwind(Animated.createAnimatedComponent(BlurView))

// One row of the actions list: a title with an optional icon before it and a
// check after it when selected.
const ActionRow = ({
  title,
  icon,
  selected,
  onPress,
}: {
  title: string
  icon?: ReactNode
  selected?: boolean
  onPress: () => void
}) => (
  <PressableScale
    feedback="opacity"
    onPress={onPress}
    className="flex-row items-center border-b border-border py-4"
  >
    {icon}
    <View className="mx-4 flex-1 justify-center">
      <Text size="base" className="font-medium">
        {title}
      </Text>
    </View>
    <View className="mr-6">
      {selected && <CheckIcon size={20} colorClassName="accent-foreground" />}
    </View>
  </PressableScale>
)

// A pending-rewards pill: the token symbol and the amount on a tinted ground.
const RewardPill = ({
  icon,
  amount,
  className,
  textClassName,
}: {
  icon: ReactNode
  amount?: string
  className: string
  textClassName: string
}) => (
  <View
    className={twMerge(
      'flex-row items-center justify-between rounded-md py-1 pl-1 pr-2',
      className,
    )}
  >
    {icon}
    <Text size="xs" className={twMerge('ml-2 font-medium', textClassName)}>
      {amount}
    </Text>
  </View>
)

const IotMapDetails = ({
  maker,
  info,
}: {
  maker: string
  info: IotHotspotInfoV0
}) => {
  const { t } = useTranslation()
  const { gain, elevation } = info

  return (
    <View className="mt-4 flex-row">
      <View className="flex-1 flex-row justify-between">
        <View>
          <Text className="font-medium">
            {t('collectablesScreen.hotspots.map.transmitScale')}
          </Text>
          <View className="flex-row items-center">
            <HexIcon
              width={16}
              height={16}
              colorClassName="accent-muted-foreground"
            />
            <Text size="xs" className="ml-2">
              ---
            </Text>
          </View>
        </View>
        <View>
          <Text className="font-medium" adjustsFontSizeToFit numberOfLines={1}>
            {t('generic.maker')}
          </Text>
          <Text size="xs" numberOfLines={1}>
            {maker}
          </Text>
        </View>
        <View>
          <Text className="font-medium" adjustsFontSizeToFit numberOfLines={1}>
            {t('generic.gain')}
          </Text>
          <Text size="xs">
            {gain ? gain / 10 : gain} {t('generic.dBi')}
          </Text>
        </View>
        <View>
          <Text className="font-medium" adjustsFontSizeToFit numberOfLines={1}>
            {t('generic.elevation')}
          </Text>
          <Text size="xs">{elevation}m</Text>
        </View>
      </View>
    </View>
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
  const { deviceType } = info

  return (
    <View className="mt-4 flex-row">
      <View className="flex-1 flex-row justify-between">
        <View>
          <Text className="font-medium">{t('generic.coverage')}</Text>
          <View className="flex-row items-center">
            <HexIcon
              width={16}
              height={16}
              colorClassName="accent-muted-foreground"
            />
            <Text size="xs" className="ml-2">
              ---
            </Text>
          </View>
        </View>
        <View>
          <Text className="font-medium">{t('generic.maker')}</Text>
          <Text size="xs">{maker}</Text>
        </View>
        <View>
          <Text className="font-medium">{t('generic.radioType')}</Text>
          <Text size="xs">
            {deviceType ? Object.keys(deviceType)[0] : '---'}
          </Text>
        </View>
      </View>
    </View>
  )
}

const hasOtherRecipient = (
  destination: PublicKey | undefined,
  wallet: PublicKey | undefined,
) =>
  !!destination &&
  !!wallet &&
  !new PublicKey(destination).equals(wallet) &&
  !new PublicKey(destination).equals(PublicKey.default)

const formatRewards = (
  rewards: Record<string, string> | undefined,
  mint: string,
  decimals: number,
) => {
  if (!rewards) return
  return formatLargeNumber(
    new BigNumber(toNumber(new BN(rewards[mint]), decimals)),
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
  const { info: hntMint } = useMint(HNT_MINT)
  // Use entity key from kta since it's a buffer
  const iotInfoAcc = useIotInfo(kta?.entityKey)
  const { metadata } = hotspotWithMeta?.content || {}
  const copyText = useCopyText()
  const collection = hotspot.grouping.find(
    (k) => k.group_key === 'collection',
  )?.group_value
  const collectionKey = usePublicKey(collection)

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

  const iotMakerApproval = mplxMetadata
    ? makerApprovalKey(IOT_CONFIG_KEY, mplxMetadata.updateAuthority)[0]
    : undefined

  const { info: iotMakerApprovalAcc } = useMakerApproval(iotMakerApproval)

  // Need to repair this hotspot if it is missing an info struct but the maker
  // has approval for that subnetwork.
  // Only check IOT hotspots since wallet app doesn't have serial numbers for mobile hotspots
  const needsRepair = Boolean(iotMakerApprovalAcc) && !iotInfoAcc?.info

  const pendingRewards = hotspotWithMeta?.pendingRewards
  const pendingIotRewardsString = formatRewards(
    pendingRewards,
    Mints.IOT,
    iotMint?.decimals || 6,
  )
  const pendingMobileRewardsString = formatRewards(
    pendingRewards,
    Mints.MOBILE,
    mobileMint?.decimals || 6,
  )
  const pendingHntRewardsString = formatRewards(
    pendingRewards,
    Mints.HNT,
    hntMint?.decimals || 8,
  )

  const hasIotRewards =
    !!pendingRewards && new BN(pendingRewards[Mints.IOT]).gt(new BN(0))
  const hasMobileRewards =
    !!pendingRewards && new BN(pendingRewards[Mints.MOBILE]).gt(new BN(0))
  const hasHntRewards =
    !!pendingRewards && new BN(pendingRewards[Mints.HNT]).gt(new BN(0))
  const hasRewards = hasIotRewards || hasMobileRewards || hasHntRewards

  const recipients = hotspotWithMeta?.rewardRecipients
  const hasRecipientSet =
    hasOtherRecipient(recipients?.[Mints.IOT]?.destination, wallet) ||
    hasOtherRecipient(recipients?.[Mints.MOBILE]?.destination, wallet) ||
    hasOtherRecipient(recipients?.[Mints.HNT]?.destination, wallet)

  const isLoading =
    mplxLoading || explorerLoading || makerLoading || loadingMeta

  const eccCompact: string | undefined = metadata?.attributes?.length
    ? metadata.attributes.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (attr: any) => attr?.trait_type === 'ecc_compact',
      )?.value
    : undefined

  const [prevExplorer, setPrevExplorer] = useState(explorer)
  if (prevExplorer !== explorer) {
    setPrevExplorer(explorer)
    if (explorer) {
      setSelectExplorerOpen(false)
    }
  }

  const handleCopyAddress = () => {
    if (!eccCompact) return

    copyText({
      message: ellipsizeAddress(eccCompact),
      copyText: eccCompact,
    })
  }

  const handleViewInExplorer = async () => {
    if (explorer && entityKey) {
      const url = getExplorerUrl({ entityKey, explorer })
      await Linking.openURL(url)
    } else if (entityKey) {
      setSelectExplorerOpen(true)
    }
  }

  const handleConfirmExplorer = async (selectedExplorer: string) => {
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
  }

  const handleClaimRewards = () => {
    if (hotspotWithMeta) {
      navigation.navigate('ClaimRewardsScreen', {
        hotspot: hotspotWithMeta,
      })
    }
  }

  const handleTransfer = () => {
    navigation.navigate('TransferCollectableScreen', {
      collectable: hotspot,
    })
  }

  const handleRecipientChange = () => {
    if (hotspotWithMeta) {
      navigation.navigate('ChangeRewardsRecipientScreen', {
        hotspot: hotspotWithMeta,
      })
    }
  }

  const handleAssertLocation = () => {
    if (hotspotWithMeta) {
      navigation.navigate(
        'AssertLocationScreen',
        { collectable: hotspotWithMeta },
        { pop: true },
      )
    }
  }

  const handleAntennaSetup = () => {
    if (hotspotWithMeta) {
      navigation.navigate('AntennaSetupScreen', {
        collectable: hotspotWithMeta,
      })
    }
  }

  const {
    mutate: handleOnboard,
    isPending: onboardLoading,
    error: onboardError,
  } = useMutation({
    mutationFn: async () => {
      if (
        !anchorProvider ||
        !entityKey ||
        !iotMakerApprovalAcc ||
        iotInfoAcc?.info
      ) {
        return
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.push('OnboardingNavigator', {
        screen: 'IotBle',
        params: {
          screen: 'AddGatewayBle',
          params: {
            network: 'IOT',
            onboardingAddress: entityKey,
          },
        },
      })
    },
  })

  return (
    <>
      <View className="border-b border-border p-3">
        {isLoading && (
          <View className="min-h-[110px] flex-row justify-center">
            <View className="justify-center">
              <Spinner colorClassName="accent-foreground" />
            </View>
          </View>
        )}
        {!isLoading && (
          <>
            <View className="flex-row">
              <Image
                className="mr-3 h-[60px] w-[60px] rounded-lg"
                source={{
                  uri: metadata?.image,
                }}
              />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <View className="flex-1 flex-row">
                    <Text
                      size="2xl"
                      className="font-bold text-foreground"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {removeDashAndCapitalize(hotspot.content.metadata.name)}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 flex-row items-center">
                  {!!streetAddress && (
                    <>
                      <View className="shrink flex-row">
                        <Text numberOfLines={1} size="base">
                          {streetAddress}
                        </Text>
                      </View>
                      <View className="mx-3 h-1.5 w-1.5 rounded-full bg-primary" />
                    </>
                  )}
                  {!!eccCompact && (
                    <PressableScale
                      feedback="opacity"
                      className="flex-row items-center"
                      onPress={handleCopyAddress}
                    >
                      <Text size="base" numberOfLines={1} className="mr-1">
                        {ellipsizeAddress(eccCompact, { numChars: 4 })}
                      </Text>
                      <CopyIcon size={16} colorClassName="accent-foreground" />
                    </PressableScale>
                  )}
                </View>
              </View>
            </View>
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
              <View className="flex-row items-center justify-center pt-3">
                <Text size="xs" className="font-medium text-destructive">
                  {onboardError.toString()}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {showActions && (
        <View className="relative">
          {onboardLoading && (
            <AnimatedBlurView
              exiting={FADE_OUT_STATE}
              className="absolute z-[100] h-full w-full items-center justify-center"
              tint="light"
              intensity={80}
            >
              <Spinner colorClassName="accent-foreground" />
            </AnimatedBlurView>
          )}
          {selectExplorerOpen ? (
            <>
              <View className="border-b border-border p-4">
                <Text size="xl" className="font-medium">
                  {t('activityScreen.selectExplorer')}
                </Text>

                <Text>{t('activityScreen.selectExplorerSubtitle')}</Text>
              </View>

              {available?.map((a) => {
                return (
                  <ActionRow
                    key={a.value}
                    title={a.label}
                    icon={
                      a.image.endsWith('svg') ? (
                        <SvgUri height={16} width={16} uri={a.image} />
                      ) : (
                        <Image className="h-4 w-4" source={{ uri: a.image }} />
                      )
                    }
                    onPress={() =>
                      void handleConfirmExplorer(a.value).catch(console.error)
                    }
                    selected={explorer?.value === a.value}
                  />
                )
              })}
            </>
          ) : (
            <>
              <PressableScale
                feedback="opacity"
                className="border-b border-border py-4"
                onPress={hasRewards ? handleClaimRewards : undefined}
                disabled={!hasRewards}
              >
                <View className="mx-4 flex-1 flex-row items-center">
                  <Text
                    size="base"
                    className={twMerge(
                      'font-medium',
                      !hasRewards && 'opacity-50',
                    )}
                  >
                    {t('collectablesScreen.hotspots.claimRewards')}
                  </Text>
                  <View className="flex-1 flex-row justify-end gap-1">
                    {hasHntRewards && (
                      <RewardPill
                        className="bg-blue-dark-700"
                        textClassName="text-blue-dark-400"
                        amount={pendingHntRewardsString}
                        icon={
                          <HntIcon
                            width={20}
                            height={20}
                            colorClassName="accent-blue-dark-400"
                          />
                        }
                      />
                    )}
                    {hasMobileRewards && (
                      <RewardPill
                        className="bg-blue-dark-500/15"
                        textClassName="text-blue-dark-500"
                        amount={pendingMobileRewardsString}
                        icon={
                          <MobileIcon
                            width={20}
                            height={20}
                            colorClassName="accent-blue-dark-500"
                          />
                        }
                      />
                    )}
                    {hasIotRewards && (
                      <RewardPill
                        className="bg-success-500/15"
                        textClassName="text-success-500"
                        amount={pendingIotRewardsString}
                        icon={
                          <IotIcon
                            width={20}
                            height={20}
                            colorClassName="accent-success-500"
                          />
                        }
                      />
                    )}
                  </View>
                </View>
              </PressableScale>
              <PressableScale
                feedback="opacity"
                className="border-b border-border py-4"
                onPress={handleRecipientChange}
              >
                <View className="mx-4 flex-1 flex-row items-center justify-between">
                  <Text size="base" className="font-medium">
                    {t('changeRewardsRecipientScreen.title')}
                  </Text>
                  {hasRecipientSet && (
                    <View className="flex-row items-center">
                      <View className="flex-row items-center justify-between rounded-md bg-warning-500/10 px-2 py-1.5">
                        <Text
                          size="xs"
                          className="font-medium text-warning-500"
                        >
                          {t('changeRewardsRecipientScreen.set')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </PressableScale>
              <ActionRow
                title={t('collectablesScreen.hotspots.viewInExplorer')}
                onPress={() => void handleViewInExplorer().catch(console.error)}
              />
              <ActionRow
                title={t('collectablesScreen.hotspots.transferHotspot')}
                onPress={handleTransfer}
              />
              <ActionRow
                title={t('collectablesScreen.hotspots.assertLocation')}
                onPress={handleAssertLocation}
              />
              {network === 'IOT' && (
                <ActionRow
                  title={t('collectablesScreen.hotspots.antennaSetup')}
                  onPress={handleAntennaSetup}
                />
              )}
              {needsRepair && (
                <ActionRow
                  key="onboard"
                  title={t('collectablesScreen.hotspots.onboard.title')}
                  onPress={() => handleOnboard()}
                />
              )}
            </>
          )}
        </View>
      )}
    </>
  )
}
