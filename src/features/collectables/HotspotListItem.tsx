import React from 'react'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import IotSymbolSvg from '@assets/images/iotSymbol.svg'
import MobileSymbolSvg from '@assets/images/mobileSymbol.svg'
import HntSymbolSvg from '@assets/images/hnt.svg'
import BN from 'bn.js'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useMint } from '@helium/helium-react-hooks'
import BigNumber from 'bignumber.js'
import { Image, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { withUniwind } from 'uniwind'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { useCollectableHeight } from '../../utils/layout'
import { formatLargeNumber } from '../../utils/accountUtils'
import { Mints } from '../../utils/constants'
import { HotspotWithPendingRewards } from '../../types/solana'

const HntSymbol = withUniwind(HntSymbolSvg)
const MobileSymbol = withUniwind(MobileSymbolSvg)
const IotSymbol = withUniwind(IotSymbolSvg)

const PILL_SHADOW = {
  shadowRadius: 6,
  shadowColor: 'black',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  elevation: 2,
}

export type HotspotListItemProps = {
  hotspot: HotspotWithPendingRewards
  onPress: (hotspot: HotspotWithPendingRewards) => void
  className?: string
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
}: HotspotListItemProps) => {
  const collectableHeight = useCollectableHeight()
  const {
    content: { metadata },
  } = hotspot

  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)
  const { info: hntMint } = useMint(HNT_MINT)

  const pendingIotRewards =
    hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT])
  const pendingMobileRewards =
    hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE])
  const pendingHntRewards =
    hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.HNT])

  const pendingIotRewardsString = pendingRewardsString(
    hotspot,
    Mints.IOT,
    iotMint?.decimals || 6,
  )
  const pendingMobileRewardsString = pendingRewardsString(
    hotspot,
    Mints.MOBILE,
    mobileMint?.decimals || 6,
  )
  const pendingHntRewardsString = pendingRewardsString(
    hotspot,
    Mints.HNT,
    hntMint?.decimals || 8,
  )

  const hasIotRewards = pendingIotRewards && pendingIotRewards.gt(new BN(0))
  const hasMobileRewards =
    pendingMobileRewards && pendingMobileRewards.gt(new BN(0))
  const hasHntRewards = pendingHntRewards && pendingHntRewards.gt(new BN(0))

  return (
    <Animated.View
      className={twMerge('w-1/2 justify-start', className)}
      entering={FADE_IN}
      exiting={FADE_OUT}
    >
      <PressableScale
        feedback="opacity"
        className="m-2 items-center rounded-[16px] bg-secondary"
        onPress={() => onPress(hotspot)}
      >
        <Image
          className="w-full rounded-lg"
          style={{ height: collectableHeight }}
          source={{
            uri: metadata?.image,
            cache: 'force-cache',
          }}
        />
        {!!hasHntRewards && (
          <View
            className="absolute right-4 top-5 flex-row items-center justify-center rounded-xl bg-background"
            style={PILL_SHADOW}
          >
            <Text className="me-1 font-medium">{pendingHntRewardsString}</Text>
            <HntSymbol colorClassName="accent-blue-dark-500" />
          </View>
        )}
        {!!hasMobileRewards && (
          <View
            className="absolute right-4 top-5 flex-row items-center justify-center rounded-xl bg-background p-1"
            style={PILL_SHADOW}
          >
            <Text className="me-1 font-medium">
              {pendingMobileRewardsString}
            </Text>
            <MobileSymbol colorClassName="accent-purple-700" />
          </View>
        )}
        {!!hasIotRewards && (
          <View
            className={twMerge(
              'absolute right-4 flex-row items-center justify-center rounded-xl bg-background p-1',
              hasMobileRewards ? 'top-[58px]' : 'top-5',
            )}
            style={PILL_SHADOW}
          >
            <Text className="me-1 font-medium">{pendingIotRewardsString}</Text>
            <IotSymbol colorClassName="accent-success-700" />
          </View>
        )}
      </PressableScale>
      {metadata?.name && (
        <Text size="xl" className="mx-4 text-center font-medium">
          {removeDashAndCapitalize(metadata.name)}
        </Text>
      )}
    </Animated.View>
  )
}

export default HotspotListItem
