import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { CollectableNavigationProp } from './collectablesTypes'
import { useBorderRadii } from '../../theme/themeHooks'
import { Collectable } from '../../types/solana'
import { ww } from '../../utils/layout'
import CircleLoader from '../../components/CircleLoader'

const COLLECTABLE_HEIGHT = ww / 2
const NftListItem = ({
  item,
  collectables,
}: {
  item: string
  collectables: Record<string, Collectable[]>
}) => {
  const { lm } = useBorderRadii()
  const { json } = collectables[item][0]
  const navigation = useNavigation<CollectableNavigationProp>()

  const handleCollectableNavigation = useCallback(
    (collection: Collectable[]) => () => {
      if (collection.length > 1) {
        navigation.navigate('CollectionScreen', {
          collection,
        })
      } else if (collection[0]?.json?.image) {
        // TODO: Cache image so we don't need to fetch uri in all the different nft screens
        navigation.navigate('NftDetailsScreen', {
          collectable: collection[0],
        })
      }
    },
    [navigation],
  )

  return (
    <Animated.View style={{ width: '50%' }} entering={FadeIn} exiting={FadeOut}>
      <TouchableOpacityBox
        marginHorizontal="s"
        marginVertical="s"
        alignItems="center"
        backgroundColor="black800"
        borderRadius="xxl"
        onPress={handleCollectableNavigation(collectables[item])}
      >
        <Image
          borderRadius={lm}
          style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
          source={{
            uri: json?.image,
            cache: 'force-cache',
          }}
        />
        <Box
          padding="s"
          position="absolute"
          justifyContent="center"
          alignItems="center"
          backgroundColor="white"
          borderRadius="round"
          bottom={20}
          right={16}
          flexDirection="row"
        >
          <Text variant="body2" fontWeight="bold" color="black" marginRight="s">
            {item}
          </Text>
          <Text variant="body2" fontWeight="bold" color="black600">
            {collectables[item].length}
          </Text>
        </Box>
      </TouchableOpacityBox>
    </Animated.View>
  )
}

export const CollectableSkeleton = () => {
  return (
    <Animated.View style={{ width: '50%' }} entering={FadeIn} exiting={FadeOut}>
      <TouchableOpacityBox
        marginHorizontal="s"
        marginVertical="s"
        alignItems="center"
      >
        <Box
          backgroundColor="surface"
          borderRadius="xl"
          height={COLLECTABLE_HEIGHT}
          width="100%"
          justifyContent="center"
          alignItems="center"
        >
          <CircleLoader loaderSize={80} />
        </Box>
      </TouchableOpacityBox>
    </Animated.View>
  )
}

export default NftListItem