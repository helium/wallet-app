import React, { useCallback, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Dimensions, ScrollView, LogBox } from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import useNetworkColor from '../../utils/useNetworkColor'
import BackScreen from '../../components/BackScreen'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import ButtonPressable from '../../components/ButtonPressable'
import Text from '../../components/Text'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<HomeStackParamList, 'AccountCollectableScreen'>

const AccountCollectableScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const COLLECTABLE_HEIGHT = Dimensions.get('window').width
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const { t } = useTranslation()

  const { collectable } = route.params

  const renderProperty = useCallback(
    (traitType: string | undefined, traitValue: string | undefined) => (
      <Box
        padding="s"
        borderRadius="s"
        borderColor="black200"
        borderWidth={1}
        marginEnd="s"
        key={`${traitType}+${traitValue}`}
      >
        <Text variant="body2" fontWeight="bold" color="grey600">
          {traitType?.toUpperCase() || 'No trait type'}
        </Text>
        <Text variant="body1" color="white">
          {traitValue || 'No trait value'}
        </Text>
      </Box>
    ),
    [],
  )

  const handleSend = useCallback(() => {
    navigation.navigate('PaymentScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const backgroundColor = useNetworkColor({})
  if (!collectable.json) {
    return null
  }
  return (
    <BackScreen
      padding="none"
      headerBackgroundColor={backgroundColor}
      title={`${collectable.json.name}`}
    >
      <Box backgroundColor={backgroundColor} paddingVertical="s" />
      <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
        <ScrollView>
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="black"
            flex={1}
            padding="m"
          >
            {collectable.json ? (
              <ImageBox
                backgroundColor="surface"
                height={COLLECTABLE_HEIGHT}
                width="100%"
                source={{ uri: collectable.json.image }}
                borderRadius="m"
              />
            ) : null}
            <ButtonPressable
              marginTop="m"
              borderRadius="round"
              backgroundColor="purple500"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="surfaceSecondary"
              backgroundColorDisabledOpacity={0.5}
              titleColorDisabled="white"
              onPress={handleSend}
              title={t('payment.send')}
              titleColor="white"
              fontWeight="bold"
              marginBottom="xl"
            />
            <Text
              variant="body1"
              fontWeight="bold"
              color="grey600"
              marginBottom="s"
            >
              Description
            </Text>
            <Text variant="body1" marginBottom="xl">
              {collectable.json.description || 'No description'}
            </Text>
            <Text
              variant="body1"
              fontWeight="bold"
              color="grey600"
              marginBottom="s"
            >
              Properties
            </Text>
            <Box flex={1} flexDirection="row">
              {collectable.json.attributes &&
                collectable.json.attributes.map(({ trait_type, value }) =>
                  renderProperty(trait_type, value),
                )}
            </Box>
          </SafeAreaBox>
        </ScrollView>
      </Animated.View>
    </BackScreen>
  )
}

export default AccountCollectableScreen
