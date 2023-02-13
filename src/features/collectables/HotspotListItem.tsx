import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { PublicKey } from '@solana/web3.js'
import { BoxProps } from '@shopify/restyle'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { useAsync } from 'react-async-hook'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { CompressedNFT } from '../../types/solana'
import { ww } from '../../utils/layout'
import { useHotspot } from '../../hooks/useHotspot'
import Box from '../../components/Box'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import ImageBox from '../../components/ImageBox'
import { Theme } from '../../theme/theme'
import { hotspots } from '../../store/slices/hotspotsSlice'
import { useAppDispatch } from '../../store/store'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { formatLargeNumber } from '../../utils/accountUtils'
import CircleLoader from '../../components/CircleLoader'

export type HotspotListItemProps = {
  hotspot: CompressedNFT
  onPress: (hotspot: CompressedNFT) => void
} & BoxProps<Theme>

const HotspotListItem = ({
  hotspot,
  onPress,
  ...rest
}: HotspotListItemProps) => {
  const mint = useMemo(() => new PublicKey(hotspot.id), [hotspot.id])
  const {
    pendingMobileRewards,
    pendingIotRewards,
    mobileRewardsLoading,
    iotRewardsLoading,
  } = useHotspot(mint)

  const COLLECTABLE_HEIGHT = ww / 2
  const dispatch = useAppDispatch()
  const { currentAccount } = useAccountStorage()
  const {
    content: { metadata },
  } = hotspot

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards > 0,
    [pendingIotRewards],
  )

  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards > 0,
    [pendingMobileRewards],
  )

  const loadingIotRewards = useMemo(() => {
    return iotRewardsLoading || pendingIotRewards === null
  }, [iotRewardsLoading, pendingIotRewards])

  const loadingMobileRewards = useMemo(() => {
    return mobileRewardsLoading || pendingMobileRewards === null
  }, [mobileRewardsLoading, pendingMobileRewards])

  useAsync(async () => {
    if (!currentAccount) return

    dispatch(
      hotspots.actions.updateHotspot({
        account: currentAccount,
        hotspotDetails: {
          hotspotId: hotspot.id,
          pendingIotRewards:
            hasIotRewards && pendingIotRewards ? pendingIotRewards : 0,
          pendingMobileRewards:
            hasMobileRewards && pendingMobileRewards ? pendingMobileRewards : 0,
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
        {(!!hasMobileRewards || loadingMobileRewards) && (
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
            {!loadingMobileRewards ? (
              <Text variant="body2Medium" marginEnd="xs" color="black">
                {formatLargeNumber(pendingMobileRewards || 0)}
              </Text>
            ) : (
              <CircleLoader marginEnd="xs" loaderSize={14} />
            )}
            <MobileSymbol color="black" />
          </Box>
        )}
        {(!!hasIotRewards || loadingIotRewards) && (
          <Box
            justifyContent="center"
            alignItems="center"
            backgroundColor="white"
            borderRadius="xl"
            position="absolute"
            top={
              hasMobileRewards || (loadingMobileRewards && loadingIotRewards)
                ? 58
                : 20
            }
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
            {!loadingIotRewards ? (
              <Text variant="body2Medium" marginEnd="xs" color="black">
                {formatLargeNumber(pendingIotRewards || 0)}
              </Text>
            ) : (
              <CircleLoader loaderSize={14} marginEnd="xs" />
            )}
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
