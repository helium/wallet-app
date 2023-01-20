import React, { useEffect, useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { PublicKey } from '@solana/web3.js'
import { BoxProps } from '@shopify/restyle'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import IotSymbol from '@assets/images/iotSymbol.svg'
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

export type HotspotListItemProps = {
  hotspot: CompressedNFT
  onPress: (hotspot: CompressedNFT) => void
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

  const mint = useMemo(() => new PublicKey(hotspot.id), [hotspot.id])
  const { pendingMobileRewards, pendingIotRewards } = useHotspot(mint)

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards > 0,
    [pendingIotRewards],
  )

  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards > 0,
    [pendingMobileRewards],
  )

  useEffect(() => {
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
  }, [
    currentAccount,
    dispatch,
    hasIotRewards,
    hasMobileRewards,
    hotspot.id,
    pendingIotRewards,
    pendingMobileRewards,
  ])

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
        {hasMobileRewards && (
          <Box
            justifyContent="center"
            alignItems="center"
            backgroundColor="white"
            borderRadius="round"
            position="absolute"
            top={20}
            right={16}
            height={28}
            width={28}
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
            <MobileSymbol color="black" />
          </Box>
        )}
        {hasIotRewards && (
          <Box
            justifyContent="center"
            alignItems="center"
            backgroundColor="white"
            borderRadius="round"
            position="absolute"
            top={hasMobileRewards ? 58 : 20}
            right={16}
            height={28}
            width={28}
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
