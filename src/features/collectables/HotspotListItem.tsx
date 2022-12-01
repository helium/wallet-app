import React, { useMemo } from 'react'
import { Image } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { PublicKey } from '@solana/web3.js'
import Text from '../../components/Text'
import { useBorderRadii } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { Collectable } from '../../types/solana'
import { ww } from '../../utils/layout'
import { useHotspot } from '../../utils/useHotspot'
import Box from '../../components/Box'
import MobileSymbol from '../../assets/images/mobileSymbol.svg'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'

export type HotspotListItemProps = {
  hotspot: Collectable
  onPress: (hotspot: Collectable) => void
}

const HotspotListItem = ({ hotspot, onPress }: HotspotListItemProps) => {
  const COLLECTABLE_HEIGHT = ww / 2
  const { lm: borderRadius } = useBorderRadii()
  const { json } = hotspot
  const mint = useMemo(
    () => new PublicKey(hotspot.mint.address),
    [hotspot.mint],
  )
  const { pendingRewards } = useHotspot(mint)

  // TODO: Add IOT Rewards once IOT MINT is available
  const hasMobileRewards = useMemo(
    () => pendingRewards && pendingRewards > 0,
    [pendingRewards],
  )

  return (
    <Animated.View
      style={{ width: '50%', justifyContent: 'center' }}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <TouchableOpacityBox
        marginHorizontal="s"
        marginVertical="s"
        alignItems="center"
        backgroundColor="black800"
        borderRadius="xxl"
        onPress={() => onPress(hotspot)}
      >
        <Image
          borderRadius={borderRadius}
          style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
          source={{
            uri: json?.image,
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
      {json?.name && (
        <Text
          textAlign="center"
          variant="body0"
          fontSize={20}
          marginHorizontal="m"
        >
          {removeDashAndCapitalize(json.name)}
        </Text>
      )}
    </Animated.View>
  )
}

export default HotspotListItem
