import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BoxProps } from '@shopify/restyle'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import HntSymbol from '@assets/images/hnt.svg'
import BN from 'bn.js'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Box from '@components/Box'
import { ReAnimatedBox } from '@components/AnimatedBox'
import ImageBox from '@components/ImageBox'
import { Theme } from '@theme/theme'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useMint } from '@helium/helium-react-hooks'
import BigNumber from 'bignumber.js'
import { useColors } from '@theme/themeHooks'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { ww } from '../../utils/layout'
import { formatLargeNumber } from '../../utils/accountUtils'
import { Mints } from '../../utils/constants'
import { HotspotWithPendingRewards } from '../../types/solana'

export type HotspotListItemProps = {
  hotspot: HotspotWithPendingRewards
  onPress: (hotspot: HotspotWithPendingRewards) => void
} & BoxProps<Theme>

const HotspotListItem = ({
  hotspot,
  onPress,
  ...rest
}: HotspotListItemProps) => {
  const colors = useColors()
  const COLLECTABLE_HEIGHT = ww / 2
  const {
    content: { metadata },
  } = hotspot

  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)
  const { info: hntMint } = useMint(HNT_MINT)
  const pendingIotRewards = useMemo(
    () => hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT]),
    [hotspot.pendingRewards],
  )
  const pendingIotRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.IOT]),
      iotMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [iotMint, hotspot])

  const pendingMobileRewards = useMemo(
    () =>
      hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE]),
    [hotspot.pendingRewards],
  )
  const pendingHntRewards = useMemo(
    () => hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.HNT]),
    [hotspot.pendingRewards],
  )

  const pendingMobileRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.MOBILE]),
      mobileMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspot, mobileMint])

  const pendingHntRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.HNT]),
      hntMint?.decimals || 8,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspot, hntMint])

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards.gt(new BN(0)),
    [pendingIotRewards],
  )
  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards.gt(new BN(0)),
    [pendingMobileRewards],
  )
  const hasHntRewards = useMemo(
    () => pendingHntRewards && pendingHntRewards.gt(new BN(0)),
    [pendingHntRewards],
  )

  return (
    <ReAnimatedBox
      style={{ width: '50%', justifyContent: 'flex-start' }}
      entering={FadeIn}
      exiting={FadeOut}
      {...rest}
    >
      <TouchableOpacityBox
        marginHorizontal="s"
        marginVertical="s"
        alignItems="center"
        backgroundColor="surfaceSecondary"
        borderRadius="xxl"
        onPress={() => onPress(hotspot)}
      >
        <ImageBox
          borderRadius="lm"
          height={COLLECTABLE_HEIGHT}
          width="100%"
          source={{
            uri: metadata?.image,
            cache: 'force-cache',
          }}
        />
        {!!hasHntRewards && (
          <Box
            justifyContent="center"
            alignItems="center"
            backgroundColor="white"
            borderRadius="xl"
            position="absolute"
            top={20}
            right={16}
            flexDirection="row"
            shadowRadius={6}
            shadowColor="black"
            shadowOffset={{
              width: 0,
              height: 3,
            }}
            shadowOpacity={0.3}
            elevation={2}
          >
            <Text variant="body2Medium" marginEnd="xs" color="black">
              {pendingHntRewardsString}
            </Text>
            <HntSymbol color={colors.hntBlue} />
          </Box>
        )}
        {!!hasMobileRewards && (
          <Box
            justifyContent="center"
            alignItems="center"
            backgroundColor="white"
            borderRadius="xl"
            padding="xs"
            position="absolute"
            top={20}
            right={16}
            flexDirection="row"
            shadowRadius={6}
            shadowColor="black"
            shadowOffset={{
              width: 0,
              height: 3,
            }}
            shadowOpacity={0.3}
            elevation={2}
          >
            <Text variant="body2Medium" marginEnd="xs" color="black">
              {pendingMobileRewardsString}
            </Text>
            <MobileSymbol color={colors.mobileBlue} />
          </Box>
        )}
        {!!hasIotRewards && (
          <Box
            justifyContent="center"
            alignItems="center"
            backgroundColor="white"
            borderRadius="xl"
            position="absolute"
            top={hasMobileRewards ? 58 : 20}
            padding="xs"
            right={16}
            flexDirection="row"
            shadowRadius={6}
            shadowColor="black"
            shadowOffset={{
              width: 0,
              height: 3,
            }}
            shadowOpacity={0.3}
            elevation={2}
          >
            <Text variant="body2Medium" marginEnd="xs" color="black">
              {pendingIotRewardsString}
            </Text>
            <IotSymbol color={colors.iotGreen} />
          </Box>
        )}
      </TouchableOpacityBox>
      {metadata?.name && (
        <Text textAlign="center" variant="subtitle1" marginHorizontal="m">
          {removeDashAndCapitalize(metadata.name)}
        </Text>
      )}
    </ReAnimatedBox>
  )
}

export default HotspotListItem
