import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useCollectableHeight } from '../../utils/layout'
import { Collectable } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'

const NftListItem = ({
  item,
  collectables,
}: {
  item: string
  collectables: Collectable[]
}) => {
  const collectableHeight = useCollectableHeight()
  const { json } = collectables[0]
  const navigation = useNavigation<CollectableNavigationProp>()

  const handleCollectableNavigation = (collection: Collectable[]) => () => {
    if (collection.length > 1) {
      navigation.navigate('CollectionScreen', {
        collection,
      })
    } else if (json) {
      navigation.navigate('NftDetailsScreen', {
        collectable: collection[0],
      })
    }
  }

  return (
    <Animated.View className="w-1/2">
      <PressableScale
        feedback="opacity"
        className="m-2 items-center rounded-[16px] bg-secondary"
        onPress={handleCollectableNavigation(collectables)}
      >
        <Image
          className="w-full rounded-lg"
          style={{ height: collectableHeight }}
          source={{
            uri: json?.image || '',
            cache: 'force-cache',
          }}
        />
        <View className="absolute bottom-5 right-4 flex-row items-center justify-center rounded-full bg-background p-2">
          <Text className="mr-1 font-medium">{item}</Text>
          <Text className="text-muted-foreground">{collectables?.length}</Text>
        </View>
      </PressableScale>
    </Animated.View>
  )
}

export const NFTSkeleton = () => {
  const collectableHeight = useCollectableHeight()
  return (
    <Animated.View className="w-1/2" entering={FADE_IN} exiting={FADE_OUT}>
      <View className="m-2 items-center">
        <View
          className="w-full items-center justify-center rounded-[16px] bg-secondary"
          style={{ height: collectableHeight }}
        >
          <Spinner size="large" />
        </View>
      </View>
    </Animated.View>
  )
}

export default NftListItem
