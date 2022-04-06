import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import Text from '../../components/Text'
import Box from '../../components/Box'
import ButtonPressable from '../../components/ButtonPressable'
import { wp } from '../../utils/layout'
import { useColors } from '../../theme/themeHooks'
import SafeAreaBox from '../../components/SafeAreaBox'

const PurchaseDataScreen = () => {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const colors = useColors()
  const [carouselIndex, setCarouselIndex] = useState(0)

  const carouselData = useMemo(() => {
    return [
      t('purchaseData.carousel.item1'),
      t('purchaseData.carousel.item2'),
      t('purchaseData.carousel.item3'),
    ]
  }, [t])

  const onSnapToItem = useCallback((index: number) => {
    setCarouselIndex(index)
  }, [])

  const renderItem = ({ item }: { item: string; index: number }) => {
    return (
      <Text
        fontSize={19}
        color="primaryText"
        maxFontSizeMultiplier={1}
        textAlign="center"
        paddingHorizontal="xxl"
      >
        {item}
      </Text>
    )
  }

  return (
    <SafeAreaBox flex={1} edges={['bottom']}>
      <Text
        marginHorizontal="l"
        marginBottom="xxxl"
        paddingBottom="xl"
        variant="h2"
        paddingTop="l"
        textAlign="center"
      >
        {t('purchaseData.title')}
      </Text>
      <Carousel
        layout="default"
        vertical={false}
        data={carouselData}
        renderItem={renderItem}
        sliderWidth={wp(100)}
        itemWidth={wp(100)}
        inactiveSlideScale={1}
        onScrollIndexChanged={onSnapToItem}
      />
      <Pagination
        dotsLength={carouselData.length}
        activeDotIndex={carouselIndex}
        dotStyle={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primaryText,
        }}
        dotContainerStyle={{ marginHorizontal: 10 }}
        inactiveDotOpacity={0.4}
        inactiveDotScale={1}
      />
      <Box flexDirection="row" marginTop="l" marginHorizontal="l">
        <ButtonPressable
          flex={1}
          backgroundColor="secondary"
          backgroundColorDisabled="plainInputBackground"
          titleColorDisabled="grey400"
          height={66}
          fontSize={19}
          backgroundColorOpacityPressed={0.7}
          borderRadius="round"
          title={t('generic.cancel')}
          onPress={navigation.goBack}
          marginRight="s"
        />
        <ButtonPressable
          flex={1}
          backgroundColor="primaryText"
          backgroundColorDisabled="plainInputBackground"
          titleColor="secondary"
          titleColorDisabled="grey400"
          height={66}
          fontSize={19}
          backgroundColorOpacityPressed={0.7}
          borderRadius="round"
          title={t('purchaseData.install')}
          onPress={() => {}}
          marginLeft="s"
        />
      </Box>
    </SafeAreaBox>
  )
}

export default memo(PurchaseDataScreen)
