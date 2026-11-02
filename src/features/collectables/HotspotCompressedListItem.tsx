import IotSymbolSvg from '@assets/images/iotSymbol.svg'
import MobileSymbolSvg from '@assets/images/mobileSymbol.svg'
import HntSymbolSvg from '@assets/images/hnt.svg'
import { toNumber } from '@helium/spl-utils'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import React from 'react'
import { View } from 'react-native'
import { Image } from '@ui/Image'
import Animated from 'react-native-reanimated'
import { PublicKey } from '@solana/web3.js'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useTranslation } from 'react-i18next'
import { withUniwind } from 'uniwind'
import { HotspotWithPendingRewards } from '../../types/solana'
import { Mints } from '../../utils/constants'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'

const HntSymbol = withUniwind(HntSymbolSvg)
const MobileSymbol = withUniwind(MobileSymbolSvg)
const IotSymbol = withUniwind(IotSymbolSvg)

export type HotspotListItemProps = {
  hotspot: HotspotWithPendingRewards
  onPress: (hotspot: HotspotWithPendingRewards) => void
  className?: string
  // The list reads the reward mints once for all rows.
  iotDecimals: number
  mobileDecimals: number
  hntDecimals: number
}

const pendingRewardsString = (
  hotspot: HotspotWithPendingRewards,
  mint: string,
  decimals: number,
) => {
  if (!hotspot.pendingRewards) return
  const num = toNumber(new BN(hotspot.pendingRewards[mint]), decimals)
  return formatLargeNumber(new BigNumber(num))
}

const HotspotListItem = ({
  hotspot,
  onPress,
  className,
  iotDecimals,
  mobileDecimals,
  hntDecimals,
}: HotspotListItemProps) => {
  const {
    content: { metadata },
  } = hotspot
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const streetAddress = useHotspotAddress(hotspot)

  const pendingIotRewards =
    hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT])
  const pendingMobileRewards =
    hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE])
  const pendingHntRewards =
    hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.HNT])

  const pendingIotRewardsString = pendingRewardsString(
    hotspot,
    Mints.IOT,
    iotDecimals,
  )
  const pendingMobileRewardsString = pendingRewardsString(
    hotspot,
    Mints.MOBILE,
    mobileDecimals,
  )
  const pendingHntRewardsString = pendingRewardsString(
    hotspot,
    Mints.HNT,
    hntDecimals,
  )

  const eccCompact = metadata?.attributes?.length
    ? metadata.attributes.find(
        (attr: { trait_type?: string; value?: string }) =>
          attr?.trait_type === 'ecc_compact',
      )?.value
    : undefined

  const hasIotRewards = pendingIotRewards && pendingIotRewards.gt(new BN(0))
  const hasMobileRewards =
    pendingMobileRewards && pendingMobileRewards.gt(new BN(0))
  const hasHntRewards = pendingHntRewards && pendingHntRewards.gt(new BN(0))

  const isOtherRecipient = (destination?: PublicKey) =>
    destination &&
    wallet &&
    !new PublicKey(destination).equals(wallet) &&
    !new PublicKey(destination).equals(PublicKey.default)

  const hasRecipientSet =
    isOtherRecipient(hotspot?.rewardRecipients?.[Mints.IOT]?.destination) ||
    isOtherRecipient(hotspot?.rewardRecipients?.[Mints.MOBILE]?.destination) ||
    isOtherRecipient(hotspot?.rewardRecipients?.[Mints.HNT]?.destination)

  return (
    <Animated.View
      className={twMerge('relative rounded-[12px] bg-secondary', className)}
    >
      <PressableScale
        feedback="opacity"
        className="flex-1 p-3 pt-2"
        onPress={() => onPress(hotspot)}
      >
        {hasRecipientSet && (
          <View className="flex-row items-center">
            <View className="flex-row items-center justify-between rounded-md bg-warning-100 px-2 py-1.5">
              <Text size="xs" className="font-medium text-foreground">
                {t('changeRewardsRecipientScreen.set')}
              </Text>
            </View>
          </View>
        )}
        <View className="flex-1 flex-row items-center">
          <Image
            className="h-[72px] w-[62px] rounded-lg"
            contentFit="cover"
            recyclingKey={hotspot.id}
            source={{
              uri: metadata?.image,
            }}
          />
          <View className="ml-3 flex-1">
            {!!metadata?.name && (
              <Text
                size="lg"
                className="text-left font-medium"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {removeDashAndCapitalize(metadata.name)}
              </Text>
            )}

            {!!streetAddress && (
              <Text numberOfLines={1} adjustsFontSizeToFit>
                {streetAddress}
              </Text>
            )}
            <Text
              size="base"
              className="font-medium text-muted-foreground"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {eccCompact ? ellipsizeAddress(eccCompact) : ''}
            </Text>
          </View>
          <View className="ml-3">
            {!!hasHntRewards && (
              <View className="mb-1 flex-row items-center justify-between rounded-md bg-blue-dark-50 py-1 pl-1 pr-2">
                <HntSymbol
                  colorClassName="accent-blue-dark-500"
                  width={20}
                  height={20}
                />
                <Text size="xs" className="ml-1 font-medium text-blue-dark-500">
                  {pendingHntRewardsString}
                </Text>
              </View>
            )}
            {!!hasMobileRewards && (
              <View className="mb-1 flex-row items-center justify-between rounded-md bg-purple-50 py-1 pl-1 pr-2">
                <MobileSymbol
                  colorClassName="accent-purple-700"
                  width={20}
                  height={20}
                />
                <Text size="xs" className="ml-1 font-medium text-purple-700">
                  {pendingMobileRewardsString}
                </Text>
              </View>
            )}
            {!!hasIotRewards && (
              <View className="flex-row items-center justify-between rounded-md bg-success-50 py-1 pl-1 pr-2">
                <IotSymbol
                  colorClassName="accent-success-700"
                  width={20}
                  height={20}
                />
                <Text size="xs" className="ml-1 font-medium text-success-700">
                  {pendingIotRewardsString}
                </Text>
              </View>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  )
}

export default HotspotListItem
