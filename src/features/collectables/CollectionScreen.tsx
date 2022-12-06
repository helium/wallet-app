import React, { useCallback, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Dimensions, Image, ViewStyle, LogBox, FlatList } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import useNetworkColor from '../../utils/useNetworkColor'
import BackScreen from '../../components/BackScreen'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import Box from '../../components/Box'
import { useBorderRadii } from '../../theme/themeHooks'
import { Collectable } from '../../types/solana'
import { ReAnimatedBox } from '../../components/AnimatedBox'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'CollectionScreen'>

const CollectionScreen = () => {
  const route = useRoute<Route>()

  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = Dimensions.get('window').width / 2
  const collectables = route.params.collection

  const safeEdges = useMemo(() => [] as Edge[], [])

  const { lm: borderRadius } = useBorderRadii()

  const handleNavigateToCollectable = useCallback(
    (collectable: Collectable) => {
      navigation.navigate('NftDetailsScreen', { collectable })
    },
    [navigation],
  )

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: Collectable }) => {
      const { json } = item

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
            backgroundColor="black800"
            borderRadius="xxl"
            onPress={() => handleNavigateToCollectable(item)}
          >
            <Image
              borderRadius={borderRadius}
              style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
              source={{
                uri: json?.image,
              }}
            />
          </TouchableOpacityBox>
        </ReAnimatedBox>
      )
    },
    [COLLECTABLE_HEIGHT, borderRadius, handleNavigateToCollectable],
  )

  const keyExtractor = useCallback((item: Collectable) => {
    return item.address.toString()
  }, [])

  const backgroundColor = useNetworkColor({})

  return (
    <BackScreen
      padding="none"
      headerBackgroundColor={backgroundColor}
      title={`${collectables[0].symbol} ${collectables.length}`}
    >
      <Box backgroundColor={backgroundColor} paddingVertical="s" />
      <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
        <SafeAreaBox
          edges={safeEdges}
          backgroundColor="black"
          flex={1}
          marginTop="s"
        >
          <FlatList
            scrollEnabled
            data={collectables}
            numColumns={2}
            renderItem={renderCollectable}
            columnWrapperStyle={{ flexDirection: 'row' } as ViewStyle}
            keyExtractor={keyExtractor}
          />
        </SafeAreaBox>
      </Animated.View>
    </BackScreen>
  )
}

export default CollectionScreen
