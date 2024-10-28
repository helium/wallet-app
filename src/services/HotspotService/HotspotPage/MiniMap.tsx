import Mapbox, { Camera, Images, LocationPuck } from '@rnmapbox/maps'
import { Box, FabButton } from '@components/index'
import React, { useCallback, useRef } from 'react'
import { useSpacing } from '@theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import Map from '@components/Map'
import { HotspotServiceNavigationProp } from '..'

type MiniMapProps = {
  hasExpandButton?: boolean
}

const MiniMap = ({ hasExpandButton = true }: MiniMapProps) => {
  const mapRef = useRef<Mapbox.MapView | null>(null)
  const spacing = useSpacing()
  const navigation = useNavigation<HotspotServiceNavigationProp>()

  const onExpand = useCallback(() => {
    navigation.navigate('Explorer')
  }, [navigation])

  return (
    <Box
      backgroundColor="cardBackground"
      borderRadius="6xl"
      width="100%"
      overflow="hidden"
      height={253}
    >
      <Map ref={mapRef} pointerEvents="none">
        <Camera maxZoomLevel={22} followUserLocation zoomLevel={16} />
        <Images
          images={{
            puck: require('@assets/images/puck.png'),
          }}
        />
        <LocationPuck
          puckBearingEnabled={false}
          visible
          puckBearing="heading"
          topImage="puck"
        />
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
