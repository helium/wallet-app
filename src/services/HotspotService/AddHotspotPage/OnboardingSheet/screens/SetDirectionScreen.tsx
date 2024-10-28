import Box from '@components/Box'
import React, { useCallback } from 'react'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import RotateIcon from '@assets/images/rotateIcon.svg'
import Map from '@components/Map'
import { Camera } from '@rnmapbox/maps'
import ImageBox from '@components/ImageBox'
import useHeading from '@hooks/useHeading'
import { degToCompass } from '@utils/degree'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { HELIUM_WORLD_POI } from '@utils/constants'
import CheckButton from '../components/CheckButton'
import { useHotspotOnboarding } from '../index'

const SetDirectionScreen = () => {
  const { t } = useTranslation()
  const { heading } = useHeading()
  const { carouselRef, setOnboardDetails } = useHotspotOnboarding()

  const onNext = useCallback(() => {
    setOnboardDetails((o) => ({
      ...o,
      azimuth: heading,
    }))
    carouselRef?.current?.snapToNext()
  }, [carouselRef, setOnboardDetails, heading])

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withSpring(`-${heading}deg`) }],
    }
  })

  return (
    <Box flex={1}>
      <Box
        padding="2xl"
        flex={1}
        justifyContent="center"
        alignItems="center"
        gap="xl"
      >
        <RotateIcon />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          marginBottom="2.5"
        >
          {t('SetDirectionScreen.title')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('SetDirectionScreen.subtitle')}
        </Text>
        <Text variant="textLgRegular" color="text.quaternary-500">
          {`${heading}° | ${degToCompass(heading)}`}
        </Text>
      </Box>
      <Box
        justifyContent="center"
        alignItems="center"
        backgroundColor="primaryBackground"
        overflow="hidden"
      >
        <ReAnimatedBox
          flex={1}
          height={572.91}
          width={572.91}
          position="absolute"
          bottom={-175}
          borderRadius="full"
          overflow="hidden"
          style={[rotationStyle]}
        >
          <Map
            style={{
              flex: 1,
            }}
            styleURL={HELIUM_WORLD_POI}
          >
            <Camera maxZoomLevel={22} followUserLocation zoomLevel={16} />
          </Map>
        </ReAnimatedBox>
        <ImageBox source={require('@assets/images/hotspotBeam.png')} />
      </Box>
      <CheckButton onPress={onNext} />
    </Box>
  )
}

export default SetDirectionScreen
