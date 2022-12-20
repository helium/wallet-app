import React, { useCallback, useMemo } from 'react'
import { FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useSpacing } from '../../theme/themeHooks'
import Box from '../../components/Box'
import globalStyles from '../../theme/globalStyles'
import FadeInOut, { DelayedFadeIn } from '../../components/FadeInOut'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import { BuyNavigationProp } from './buyTypes'
import ModalScreen from '../../components/ModalScreen'
import ProviderListItem, { PaymentProvider } from './ProviderListItem'

const ChooseProviderScreen = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const navigation = useNavigation<BuyNavigationProp>()

  const contentContainer = useMemo(
    () => ({
      paddingBottom: spacing.xxxl,
    }),
    [spacing.xxxl],
  )

  const tokens = useMemo((): PaymentProvider[] => {
    return ['coinbase']
  }, [])

  const handleTokenItemPress = useCallback(
    (provider: PaymentProvider) => () => {
      if (provider) {
        navigation.navigate('CoinbaseWebView')
      }
    },
    [navigation],
  )

  const renderItem = useCallback(
    ({ item, index }) => {
      const firstItem = index === 0
      const lastItem = index === tokens.length - 1

      return (
        <FadeInOut>
          <ProviderListItem
            borderTopStartRadius="xl"
            borderTopEndRadius="xl"
            borderBottomStartRadius="xl"
            borderBottomEndRadius="xl"
            marginHorizontal="l"
            marginBottom={!lastItem ? 'l' : undefined}
            marginTop={firstItem ? 'l' : undefined}
            provider={item}
            onPress={handleTokenItemPress(item)}
          />
        </FadeInOut>
      )
    },
    [handleTokenItemPress, tokens.length],
  )

  const keyExtractor = useCallback((item, index) => item.signature + index, [])

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <ModalScreen onClose={onClose} title={t('buyScreen.chooseProvider')}>
      <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
        <Box flex={1}>
          <FlatList
            contentContainerStyle={contentContainer}
            data={tokens}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        </Box>
      </ReAnimatedBox>
    </ModalScreen>
  )
}

export default ChooseProviderScreen
