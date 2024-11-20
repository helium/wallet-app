import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import Map from '@components/Map'
import useHotspots from '@hooks/useHotspots'
import {
  Camera,
  Location,
  MapState,
  MarkerView,
  UserLocation,
} from '@rnmapbox/maps'
import React, { useCallback, useState } from 'react'
import TotalHotspotPuck from '@assets/images/totalHotspotPuck.svg'
import { useSpacing } from '@theme/themeHooks'
import Text from '@components/Text'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'

const ExplorerPage = () => {
  const { hotspotsWithMeta } = useHotspots()
  const spacing = useSpacing()
  const [userLocation, setUserLocation] = useState<Location>()
  const [showTotalHotspotPuck, setShowTotalHotspotPuck] = useState(false)

  const handleCameraChanged = useCallback((state: MapState) => {
    if (state.properties.zoom > 12) {
      setShowTotalHotspotPuck(true)
    } else {
      setShowTotalHotspotPuck(false)
    }
  }, [])

  const TotalHotspotPuckContainer = useCallback(() => {
    if (!showTotalHotspotPuck) return null

    return (
      <ReAnimatedBox
        entering={FadeIn}
        exiting={FadeOut}
        position="absolute"
        top={spacing['8xl']}
        right={spacing['4xl']}
        zIndex={1000}
      >
        <Box
          position="absolute"
          top={0}
          right={0}
          left={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          zIndex={1}
        >
          <Text variant="textLgSemibold" color="primaryBackground">
            {hotspotsWithMeta?.length}
          </Text>
        </Box>
        <TotalHotspotPuck />
      </ReAnimatedBox>
    )
  }, [showTotalHotspotPuck, hotspotsWithMeta, spacing])

  return (
    <Box flex={1}>
      <TotalHotspotPuckContainer />
      <Map onCameraChanged={handleCameraChanged}>
        <Camera
          zoomLevel={1}
          maxZoomLevel={22}
          pitch={0}
          centerCoordinate={[
            userLocation?.coords.longitude || 0,
            userLocation?.coords.latitude || 0,
          ]}
          followPitch={0}
        />
        <UserLocation
          showsUserHeadingIndicator
          androidRenderMode="normal"
          animated
          onUpdate={setUserLocation}
        >
          <MarkerView
            coordinate={[
              userLocation?.coords.longitude || 0,
              userLocation?.coords.latitude || 0,
            ]}
          >
            <ImageBox source={require('@assets/images/puck.png')} />
          </MarkerView>
        </UserLocation>
        {hotspotsWithMeta.map((hotspot) => {
          const subDao = hotspot?.content?.metadata?.hotspot_infos?.iot
            ?.device_type
            ? 'iot'
            : 'mobile'
          const { long, lat } = hotspot.content.metadata.hotspot_infos[subDao]

          if (!long || !lat) return null

          return (
            <MarkerView
              id={hotspot.id}
              coordinate={[long, lat]}
              allowOverlapWithPuck
            >
              <ImageBox
                source={require('@assets/images/hotspotBlackMarker.png')}
              />
            </MarkerView>
          )
        })}
      </Map>
    </Box>
  )
}

export default ExplorerPage
