import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { HotspotWithPendingRewards } from '../../types/solana'
import { Mints } from '../../utils/constants'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'

export type HotspotListItemProps = {
  hotspot: HotspotWithPendingRewards
  onPress: (hotspot: HotspotWithPendingRewards) => void
} & BoxProps<Theme>

const HotspotListItem = ({
  hotspot,
  onPress,
  ...rest
}: HotspotListItemProps) => {
  const {
    content: { metadata },
  } = hotspot
  const streetAddress = useHotspotAddress(hotspot)

  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)

  const pendingIotRewards = useMemo(
    () => hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT]),
    [hotspot],
  )

  const pendingIotRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.IOT]),
      iotMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspot, iotMint])

  const pendingMobileRewards = useMemo(
    () =>
      hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE]),
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

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find(
      (attr) => attr?.trait_type === 'ecc_compact',
    )?.value
  }, [metadata])

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards.gt(new BN(0)),
    [pendingIotRewards],
  )
  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards.gt(new BN(0)),
    [pendingMobileRewards],
  )

  return (
    <ReAnimatedBox entering={FadeIn} exiting={FadeOut} {...rest}>
      <TouchableOpacityBox
        flexDirection="row"
        marginHorizontal="s"
        marginVertical="xs"
        backgroundColor="surfaceSecondary"
        borderRadius="xl"
        onPress={() => onPress(hotspot)}
      >
        <ImageBox
          borderRadius="lm"
          height={80}
          width={80}
          source={{
            uri: metadata?.image,
            cache: 'force-cache',
          }}
        />
        <Box marginStart="m" marginVertical="s" flex={1}>
          {metadata?.name && (
            <Text
              textAlign="left"
              variant="subtitle2"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {removeDashAndCapitalize(metadata.name)}
            </Text>
          )}

          {streetAddress && (
            <Text variant="body2" numberOfLines={1} adjustsFontSizeToFit>
              {streetAddress}
            </Text>
          )}
          <Text
            variant="subtitle3"
            color="secondaryText"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {eccCompact ? ellipsizeAddress(eccCompact) : ''}
          </Text>
        </Box>
        <Box marginVertical="s" marginHorizontal="s">
          {!!hasMobileRewards && (
            <Box
              marginBottom="s"
              justifyContent="center"
              alignItems="center"
              backgroundColor="white"
              borderRadius="xl"
              padding="xs"
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
              <MobileSymbol color="black" />
            </Box>
          )}
          {!!hasIotRewards && (
            <Box
              justifyContent="center"
              alignItems="center"
              backgroundColor="white"
              borderRadius="xl"
              padding="xs"
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
              <IotSymbol color="black" />
            </Box>
          )}
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}

export default HotspotListItem
