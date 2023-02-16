import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BoxProps } from '@shopify/restyle'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { useAsync } from 'react-async-hook'
import BN from 'bn.js'
import { toNumber } from '@helium/spl-utils'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Box from '../../components/Box'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import ImageBox from '../../components/ImageBox'
import { Theme } from '../../theme/theme'
import { hotspots } from '../../store/slices/hotspotsSlice'
import { useAppDispatch } from '../../store/store'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
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
  const dispatch = useAppDispatch()
  const { currentAccount } = useAccountStorage()
  const {
    content: { metadata },
  } = hotspot

  const pendingIotRewards = useMemo(
    () => hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT]),
    [hotspot.pendingRewards],
  )
  const pendingMobileRewards = useMemo(
    () =>
      hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE]),
    [hotspot.pendingRewards],
  )

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

  useAsync(async () => {
    if (!currentAccount) return

    dispatch(
      hotspots.actions.updateHotspot({
        account: currentAccount,
        hotspotDetails: {
          hotspotId: hotspot.id,
          pendingIotRewards:
            hasIotRewards && pendingIotRewards ? pendingIotRewards : new BN(0),
          pendingMobileRewards:
            hasMobileRewards && pendingMobileRewards
              ? pendingMobileRewards
              : new BN(0),
        },
      }),
    )
  }, [pendingIotRewards, pendingMobileRewards])

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
                {formatLargeNumber(
                  toNumber(pendingMobileRewards || new BN(0), 6),
                )}
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
                {formatLargeNumber(toNumber(pendingIotRewards || new BN(0), 6))}
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
