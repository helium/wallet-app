import React, { useCallback, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Image, LogBox, FlatList } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { PressableScale } from '@ui/PressableScale'
import { useCollectableHeight } from '@utils/layout'
import { withUniwind } from 'uniwind'
import BackHeader from './components/BackHeader'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { Collectable } from '../../types/solana'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

const SafeArea = withUniwind(SafeAreaView)

type Route = RouteProp<CollectableStackParamList, 'CollectionScreen'>

const CollectableTile = ({
  collectable,
  imageStyle,
  onPress,
}: {
  collectable: Collectable
  imageStyle: { height: number }
  onPress: (collectable: Collectable) => void
}) => (
  <Animated.View className="w-1/2">
    <PressableScale
      feedback="opacity"
      className="m-2 items-center rounded-[16px] bg-secondary"
      onPress={() => onPress(collectable)}
    >
      <Image
        className="w-full rounded-lg"
        style={imageStyle}
        source={{
          uri: collectable.json?.image || '',
        }}
      />
    </PressableScale>
  </Animated.View>
)

const keyExtractor = (item: Collectable) => item.id

const CollectionScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const collectableHeight = useCollectableHeight()
  const collectables = route.params.collection

  const imageStyle = useMemo(
    () => ({ height: collectableHeight }),
    [collectableHeight],
  )

  const handleNavigateToCollectable = useCallback(
    (collectable: Collectable) => {
      if (collectable) {
        navigation.navigate('NftDetailsScreen', { collectable })
      }
    },
    [navigation],
  )

  const renderCollectable = useCallback(
    ({ item }: { item: Collectable }) => (
      <CollectableTile
        collectable={item}
        imageStyle={imageStyle}
        onPress={handleNavigateToCollectable}
      />
    ),
    [imageStyle, handleNavigateToCollectable],
  )

  return (
    <SafeArea className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        className="mt-6"
        title={`${collectables[0]?.content?.metadata?.symbol} ${collectables.length}`}
      />
      <Animated.View className="mt-2 flex-1">
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          scrollEnabled
          data={collectables}
          numColumns={2}
          renderItem={renderCollectable}
          keyExtractor={keyExtractor}
        />
      </Animated.View>
    </SafeArea>
  )
}

export default CollectionScreen
