import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { PublicKey } from '@solana/web3.js'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { CompressedNFT } from '../../types/solana'
import { ww } from '../../utils/layout'
import { useHotspot } from '../../hooks/useHotspot'
import Box from '../../components/Box'
import MobileSymbol from '../../assets/images/mobileSymbol.svg'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import ImageBox from '../../components/ImageBox'

export type HotspotListItemProps = {
  hotspot: CompressedNFT
  onPress: (hotspot: CompressedNFT) => void
}

const HotspotListItem = ({ hotspot, onPress }: HotspotListItemProps) => {
  const COLLECTABLE_HEIGHT = ww / 2
  const {
    content: { metadata },
  } = hotspot
  const mint = useMemo(() => new PublicKey(hotspot.id), [hotspot.id])
  const { pendingRewards } = useHotspot(mint)

  // TODO: Add IOT Rewards once IOT MINT is available
  const hasMobileRewards = useMemo(
    () => pendingRewards && pendingRewards > 0,
    [pendingRewards],
  )

  return (
    <ReAnimatedBox
      style={{ width: '50%', justifyContent: 'center' }}
      entering={FadeIn}
      exiting={FadeOut}
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
