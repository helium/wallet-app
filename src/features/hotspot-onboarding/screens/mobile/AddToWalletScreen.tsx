import Box from '@components/Box'
import Text from '@components/Text'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ImageBox from '@components/ImageBox'
import Map from '@components/Map'
import { Camera } from '@rnmapbox/maps'
import { getAddressFromLatLng } from '@utils/location'
import { useAsync } from 'react-async-hook'
import AddToWalletButton from '../../components/WalletButton'
import { useHotspotOnboarding } from '../../OnboardingSheet'

export const AddToWalletScreen = () => {
  const { t } = useTranslation()

  const {
    onboardDetails: {
      deviceInfo: { deviceType, animalName },
      latitude,
      longitude,
      height,
      azimuth,
    },
    onboardDeviceError,
  } = useHotspotOnboarding()

  const { result: location } = useAsync(async () => {
    const address = await getAddressFromLatLng(latitude, longitude)

    return `~${address?.street ? `${address?.street}, ` : ''}${address.city}, ${
      address.state
    }`
  }, [latitude, longitude])

  const floor = useMemo(() => height / 5, [height])

  return (
    <Box alignItems="center" flex={1} padding="2xl">
      <Box height={266} width="100%" marginBottom="7xl">
        <Box flex={1} width="100%" overflow="hidden" borderRadius="6xl">
          <Map style={{ flex: 1 }} pointerEvents="none">
            <Camera
              maxZoomLevel={22}
              centerCoordinate={[longitude, latitude]}
              zoomLevel={16}
            />
          </Map>
        </Box>

        {deviceType === 'WifiOutdoor' && (
          <Box
            position="absolute"
            bottom={-140}
            left={-50}
            right={0}
            alignItems="center"
          >
            <ImageBox source={require('@assets/images/outdoorHotspot.png')} />
          </Box>
        )}

        {deviceType === 'WifiIndoor' && (
          <Box
            position="absolute"
            bottom={-120}
            left={-50}
            right={0}
            alignItems="center"
          >
            <ImageBox source={require('@assets/images/indoorHotspot.png')} />
          </Box>
        )}
      </Box>
      <Text
        variant="displaySmRegular"
        color="text.quaternary-500"
        fontSize={12}
        marginTop="4xl"
        marginBottom="1.5"
        letterSpacing={3}
      >
        {t('AddToWalletScreen.title')}
      </Text>
      <Text
        variant="displaySmSemibold"
        color="primaryText"
        textAlign="center"
        marginBottom="2xl"
      >
        {animalName}
      </Text>
      <Box
        backgroundColor="cardBackground"
        borderRadius="2xl"
        paddingVertical="2.5"
        paddingHorizontal="2"
        width="100%"
      >
        <Text variant="textMdSemibold" color="primaryText" textAlign="center">
          {location}
        </Text>
        <Text
          variant="textMdRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {deviceType === 'WifiIndoor'
            ? t('AddToWalletScreen.addressDetailsIndoor', {
                floor,
              })
            : t('AddToWalletScreen.addressDetails', {
                floor,
                direction: `${azimuth}°`,
              })}
        </Text>
      </Box>
      {onboardDeviceError && (
        <Text
          variant="textLgMedium"
          color="error.500"
          marginTop="xl"
          textAlign="center"
        >
          {t('AddToWalletScreen.errorOnboarding')}
        </Text>
      )}
      <AddToWalletButton />
    </Box>
  )
}

export default AddToWalletScreen
