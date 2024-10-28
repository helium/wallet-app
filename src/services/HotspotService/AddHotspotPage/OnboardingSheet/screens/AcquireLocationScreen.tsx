import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfoIcon from '@assets/images/infoIcon.svg'
import ImageBox from '@components/ImageBox'
import MiniMap from '@services/HotspotService/HotspotPage/MiniMap'
import { getAddressFromLatLng } from '@utils/location'
import { useAsync } from 'react-async-hook'
import * as Location from 'expo-location'
import { useHotspotOnboarding } from '../index'
import CheckButton from '../components/CheckButton'

export const AcquireLocationScreen = () => {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const { t } = useTranslation()
  const { carouselRef, setOnboardDetails } = useHotspotOnboarding()

  const onNext = useCallback(() => {
    if (!lat || !lng) {
      // TODO: show error. Show retry button
      return
    }

    carouselRef?.current?.snapToNext()
    setOnboardDetails((o) => ({
      ...o,
      latitude: lat,
      longitude: lng,
    }))
  }, [carouselRef, setOnboardDetails, lat, lng])

  const DeterminingLocation = useCallback(() => {
    return (
      <>
        <ImageBox
          source={require('@assets/images/satellite.png')}
          marginBottom="2xl"
        />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          marginBottom="2.5"
        >
          {t('AcquireLocationScreen.title')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('AcquireLocationScreen.subtitle')}
        </Text>
        <TouchableContainer
          marginTop="2xl"
          borderRadius="full"
          backgroundColor="bg.quaternary"
          backgroundColorPressed="gray.300"
          paddingHorizontal="xl"
          paddingVertical="2"
          flexDirection="row"
          alignItems="center"
          gap="sm"
          pressableStyles={{ flex: undefined }}
        >
          <InfoIcon />
          <Text variant="textLgMedium" color="text.quaternary-500">
            {t('AcquireLocationScreen.gpsHelp')}
          </Text>
        </TouchableContainer>
      </>
    )
  }, [t])

  const { result: location, loading: loadingLocation } = useAsync(async () => {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.LocationAccuracy.Highest,
    })

    const newLat = loc?.coords.latitude
    const newLng = loc?.coords.longitude
    setLat(newLat)
    setLng(newLng)

    if (!newLat || !newLng) {
      return null
    }

    const address = await getAddressFromLatLng(newLat, newLng)

    return `~${address.street}, ${address.city}, ${address.state}`
  }, [])

  const DeterminedLocation = useCallback(() => {
    return (
      <Box>
        <Box
          width="100%"
          flexDirection="row"
          marginBottom="4xl"
          backgroundColor="bg.secondary-hover"
          borderRadius="4xl"
        >
          <Box flexDirection="column" flex={1}>
            <MiniMap hasExpandButton={false} />
            <Text
              variant="textSmMedium"
              color="primaryText"
              textAlign="center"
              paddingVertical="xl"
            >
              {location}
            </Text>
          </Box>
        </Box>
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          marginBottom="2.5"
          textAlign="center"
        >
          {t('AcquireLocationScreen.isThisCorrect')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('AcquireLocationScreen.locationDetermined')}
        </Text>
      </Box>
    )
  }, [t, location])

  return (
    <Box justifyContent="center" alignItems="center" flex={1} padding="2xl">
      {!loadingLocation && location ? (
        <DeterminedLocation />
      ) : (
        <DeterminingLocation />
      )}
      {location && <CheckButton onPress={onNext} />}
    </Box>
  )
}

export default AcquireLocationScreen
