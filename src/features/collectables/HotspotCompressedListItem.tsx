import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BoxProps } from '@shopify/restyle'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import BN from 'bn.js'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Box from '@components/Box'
import { ReAnimatedBox } from '@components/AnimatedBox'
import ImageBox from '@components/ImageBox'
import { Theme } from '@theme/theme'
import { formatLargeNumber, ellipsizeAddress } from '@utils/accountUtils'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import BigNumber from 'bignumber.js'
import { useMint } from '@helium/helium-react-hooks'
import { Mints } from '../../utils/constants'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { HotspotWithPendingRewards } from '../../types/solana'
import useHotspotLocation from '../../hooks/useHotspotLocation'

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

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find((attr) => attr.trait_type === 'ecc_compact')
      ?.value
  }, [metadata])

  const streetAddress = useHotspotLocation(eccCompact)

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
        <Box
          marginStart="m"
          marginVertical="s"
          flex={1}
          justifyContent="center"
        >
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
