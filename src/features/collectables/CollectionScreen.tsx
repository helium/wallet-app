import React, { useCallback } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Dimensions, Image, LogBox, FlatList } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import 'text-encoding-polyfill'
import BackScreen from '../../components/BackScreen'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import { useBorderRadii } from '../../theme/themeHooks'
import { CompressedNFT } from '../../types/solana'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import useHaptic from '../../hooks/useHaptic'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'CollectionScreen'>

const CollectionScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = Dimensions.get('window').width / 2
  const collectables = route.params.collection
  const { lm: borderRadius } = useBorderRadii()
  const { triggerImpact } = useHaptic()

  const handleNavigateToCollectable = useCallback(
    (collectable: CompressedNFT) => {
      if (collectable.content.metadata) {
        triggerImpact()
        navigation.navigate('NftDetailsScreen', { collectable })
      }
    },
    [navigation, triggerImpact],
  )

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: CompressedNFT }) => {
      const {
        content: { metadata },
      } = item

      return (
        <ReAnimatedBox
          style={{ width: '50%' }}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <TouchableOpacityBox
            marginHorizontal="s"
            marginVertical="s"
            alignItems="center"
            backgroundColor="surfaceSecondary"
            borderRadius="xxl"
            onPress={() => handleNavigateToCollectable(item)}
          >
            <Image
              borderRadius={borderRadius}
              style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
              source={{
                uri: metadata?.image,
              }}
            />
          </TouchableOpacityBox>
        </ReAnimatedBox>
      )
    },
    [COLLECTABLE_HEIGHT, borderRadius, handleNavigateToCollectable],
  )

  const keyExtractor = useCallback((item: CompressedNFT) => {
    return item.id.toString()
  }, [])

  return (
    <BackScreen
      padding="none"
      headerBackgroundColor="primaryBackground"
      title={`${collectables[0].content.metadata.symbol} ${collectables.length}`}
    >
      <ReAnimatedBox
        marginTop="s"
        entering={DelayedFadeIn}
        style={globalStyles.container}
      >
        <FlatList
          scrollEnabled
          data={collectables}
          numColumns={2}
          renderItem={renderCollectable}
          keyExtractor={keyExtractor}
        />
      </ReAnimatedBox>
    </BackScreen>
  )
}

export default CollectionScreen
