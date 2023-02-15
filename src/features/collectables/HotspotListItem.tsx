import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { BoxProps } from '@shopify/restyle'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { useAsync } from 'react-async-hook'
import BN from 'bn.js'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { ww } from '../../utils/layout'
import Box from '../../components/Box'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import ImageBox from '../../components/ImageBox'
import { Theme } from '../../theme/theme'
import { hotspots } from '../../store/slices/hotspotsSlice'
import { useAppDispatch } from '../../store/store'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { formatLargeNumber } from '../../utils/accountUtils'
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
  const COLLECTABLE_HEIGHT = ww / 2
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
              {formatLargeNumber(pendingMobileRewards || new BN(0))}
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
              {formatLargeNumber(pendingIotRewards || new BN(0))}
            </Text>
            <IotSymbol color="black" />
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
