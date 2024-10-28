import Box from '@components/Box'
import React, { useCallback } from 'react'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import ImageBox from '@components/ImageBox'

import { useHotspotOnboarding } from '../index'
import ForwardButton from '../components/ForwardButton'

export const KeepYourBoxScreen = () => {
  const { t } = useTranslation()
  const {
    onboardDetails: {
      deviceInfo: { deviceType },
    },
    carouselRef,
  } = useHotspotOnboarding()

  const onNext = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  return (
    <Box justifyContent="center" alignItems="center" flex={1} padding="2xl">
      {deviceType === 'WifiOutdoor' && (
        <ImageBox source={require('@assets/images/hotspotBox.png')} />
      )}
      {deviceType === 'WifiIndoor' && (
        <ImageBox source={require('@assets/images/indoorHotspotBox.png')} />
      )}
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('KeepYourBoxScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('KeepYourBoxScreen.subtitle')}
      </Text>
      <ForwardButton onPress={onNext} />
    </Box>
  )
}

export default KeepYourBoxScreen
