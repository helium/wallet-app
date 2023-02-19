/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BoxProps } from '@shopify/restyle'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import BN from 'bn.js'
import { Balance } from '@helium/currency'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Box from '@components/Box'
import { ReAnimatedBox } from '@components/AnimatedBox'
import ImageBox from '@components/ImageBox'
import { Theme } from '@theme/theme'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { formatLargeNumber, ellipsizeAddress } from '../../utils/accountUtils'
import type { HotspotWithPendingRewards } from '../../utils/solanaUtils'
import { Mints } from '../../utils/constants'

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

  const pendingIotRewards = useMemo(
    () => hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT]),
    [hotspot],
  )

  const pendingIotRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const realAmount = Balance.fromIntAndTicker(
      new BN(hotspot.pendingRewards[Mints.IOT]) as any,
      'IOT',
    )
    return formatLargeNumber(realAmount.bigBalance as unknown as BN)
  }, [hotspot])

  const pendingMobileRewards = useMemo(
    () =>
      hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE]),
    [hotspot.pendingRewards],
  )

  const pendingMobileRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const realAmount = Balance.fromIntAndTicker(
      new BN(hotspot.pendingRewards[Mints.MOBILE]) as any,
      'MOBILE',
    )
    return formatLargeNumber(realAmount.bigBalance as unknown as BN)
  }, [hotspot])

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find((attr) => attr.trait_type === 'ecc_compact')
      ?.value
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
            <Text textAlign="left" variant="subtitle2" adjustsFontSizeToFit>
              {removeDashAndCapitalize(metadata.name)}
            </Text>
          )}

          <Box flexGrow={1} />

          <Box flexDirection="row" marginEnd="s" alignItems="flex-end">
            <Text variant="subtitle3" color="secondaryText">
              {eccCompact ? ellipsizeAddress(eccCompact) : ''}
            </Text>
          </Box>
        </Box>
        <Box marginVertical="s" marginEnd="s">
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
