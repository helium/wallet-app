import React, { useCallback, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Dimensions, Image, ViewStyle } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { Nft, NftWithToken, Sft, SftWithToken } from '@metaplex-foundation/js'
import useNetworkColor from '../../utils/useNetworkColor'
import BackScreen from '../../components/BackScreen'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import Box from '../../components/Box'

type Route = RouteProp<HomeStackParamList, 'AccountCollectionScreen'>

const AccountCollectionScreen = () => {
  const route = useRoute<Route>()

  const navigation = useNavigation<HomeNavigationProp>()
  const COLLECTABLE_HEIGHT = Dimensions.get('window').width / 2
  const collectables = route.params.collection

  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  const handleNavigateToCollectable = useCallback(
    (collectable: Sft | SftWithToken | Nft | NftWithToken) => {
      navigation.navigate('AccountCollectableScreen', { collectable })
    },
    [navigation],
  )

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: Sft | SftWithToken | Nft | NftWithToken }) => {
      const { json } = item

      return (
        <Animated.View
          style={{ width: '50%' }}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <TouchableOpacityBox
            marginHorizontal="s"
            marginVertical="s"
            alignItems="center"
            backgroundColor="surface"
            borderRadius="m"
            onPress={() => handleNavigateToCollectable(item)}
          >
            <Image
              borderRadius={10}
              style={{ height: COLLECTABLE_HEIGHT, width: '100%' }}
              source={{
                uri: json?.image,
              }}
            />
          </TouchableOpacityBox>
        </Animated.View>
      )
    },
    [COLLECTABLE_HEIGHT, handleNavigateToCollectable],
  )

  const keyExtractor = useCallback(
    (item: Sft | SftWithToken | Nft | NftWithToken) => {
      return item.address.toString()
    },
    [],
  )

  const contentContainerStyle = useMemo(() => ({}), [])

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
          <Animated.FlatList
            scrollEnabled
            data={collectables}
            numColumns={2}
            contentContainerStyle={contentContainerStyle}
            renderItem={renderCollectable}
            columnWrapperStyle={{ flexDirection: 'row' } as ViewStyle}
            keyExtractor={keyExtractor}
          />
        </SafeAreaBox>
      </Animated.View>
    </BackScreen>
  )
}

export default AccountCollectionScreen
