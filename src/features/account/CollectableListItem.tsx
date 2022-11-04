import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import { useBorderRadii } from '../../theme/themeHooks'
import { Collectable } from '../../types/solana'
import { ww } from '../../utils/layout'
import CircleLoader from '../../components/CircleLoader'

const COLLECTABLE_HEIGHT = ww / 2
const CollectableListItem = ({
  item,
  collectables,
}: {
  item: string
  collectables: Record<string, Collectable[]>
}) => {
  const { lm } = useBorderRadii()
  const { json } = collectables[item][0]
  const navigation = useNavigation<HomeNavigationProp>()

  const handleCollectableNavigation = useCallback(
    (collection: Collectable[]) => () => {
      if (collection.length > 1) {
        navigation.navigate('AccountCollectionScreen', {
          collection,
        })
      } else {
        navigation.navigate('AccountCollectableScreen', {
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
        backgroundColor="surface"
        borderRadius="m"
        onPress={handleCollectableNavigation(collectables[item])}
      >
        <Image
          borderRadius={lm}
          style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
          source={{
            uri: json?.image,
          }}
        />
        <Box
          backgroundColor="black"
          borderRadius="s"
          padding="s"
          position="absolute"
          bottom={8}
          left={8}
          flexDirection="row"
        >
          <Text variant="body2" fontWeight="bold" color="white" marginRight="s">
            {item}
          </Text>
          <Text variant="body2" fontWeight="bold" color="grey600">
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
          borderRadius="m"
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

export default CollectableListItem
