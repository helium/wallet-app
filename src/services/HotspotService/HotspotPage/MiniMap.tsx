import Mapbox, {
  Location,
  Camera,
  Images,
  MarkerView,
  UserLocation,
} from '@rnmapbox/maps'
import { Box, FabButton, ImageBox } from '@components/index'
import React, { useCallback, useRef, useState } from 'react'
import { useSpacing } from '@theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import Map from '@components/Map'
import HotspotMarker from '@assets/images/hotspotMarker.svg'
import { HotspotServiceNavigationProp } from '..'

type MiniMapProps = {
  hasExpandButton?: boolean
  height?: number
  lat?: number
  long?: number
  children?: React.ReactNode
  onUserLocationUpdate?: (location: Location) => void
}

const MiniMap = ({
  hasExpandButton = true,
  height = 253,
  lat,
  long,
  onUserLocationUpdate,
  children,
}: MiniMapProps) => {
  const mapRef = useRef<Mapbox.MapView | null>(null)
  const spacing = useSpacing()
  const navigation = useNavigation<HotspotServiceNavigationProp>()
  const [userLocation, setUserLocation] = useState<Location>()

  const onExpand = useCallback(() => {
    navigation.navigate('Explorer')
  }, [navigation])

  const handleUserLocationUpdate = useCallback(
    (location: Location) => {
      setUserLocation(location)
      onUserLocationUpdate?.(location)
    },
    [onUserLocationUpdate],
  )

  return (
    <Box
      backgroundColor="cardBackground"
      borderRadius="6xl"
      width="100%"
      overflow="hidden"
      height={height}
    >
      <Map ref={mapRef} pointerEvents="none">
        <Camera
          maxZoomLevel={22}
          followUserLocation={!(lat && long)}
          zoomLevel={16}
          centerCoordinate={lat && long ? [long, lat] : undefined}
        />
        <Images
          images={{
            puck: require('@assets/images/puck.png'),
          }}
        />
        {lat && long ? (
          <MarkerView id="hotspot-marker" coordinate={[long, lat]}>
            <HotspotMarker />
          </MarkerView>
        ) : (
          <UserLocation
            showsUserHeadingIndicator
            androidRenderMode="normal"
            animated
            onUpdate={handleUserLocationUpdate}
          >
            <MarkerView
              coordinate={[
                userLocation?.coords.longitude || 0,
                userLocation?.coords.latitude || 0,
              ]}
            >
              <ImageBox source={require('@assets/images/puckNoBearing.png')} />
            </MarkerView>
          </UserLocation>
        )}
        {children}
      </Map>
      {hasExpandButton && (
        <FabButton
          size={48.27}
          icon="expand"
          position="absolute"
          bottom={spacing.xl}
          right={spacing.xl}
          onPress={onExpand}
        />
      )}
    </Box>
  )
}

export default MiniMap
