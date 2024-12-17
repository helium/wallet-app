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
import TotalHotspotPuck from '@assets/svgs/totalHotspotPuck.svg'
import { useSpacing } from '@config/theme/themeHooks'
import Text from '@components/Text'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAsync } from 'react-async-hook'
import { useEntityKey } from '@hooks/useEntityKey'
import { useIotInfo } from '@hooks/useIotInfo'
import { useMobileInfo } from '@hooks/useMobileInfo'
import { parseH3BNLocation } from '@utils/h3'
import { HotspotWithPendingRewards } from '../../../../types/solana'

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
          minZoomLevel={1}
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
            <ImageBox source={require('@assets/images/puckNoBearing.png')} />
          </MarkerView>
        </UserLocation>
        {hotspotsWithMeta.map((hotspot) => (
          <HotspotMarker key={hotspot.id} hotspot={hotspot} />
        ))}
      </Map>
    </Box>
  )
}

const HotspotMarker = ({ hotspot }: { hotspot: HotspotWithPendingRewards }) => {
  const entityKey = useEntityKey(hotspot)
  const iotInfoAcc = useIotInfo(entityKey)
  const mobileInfoAcc = useMobileInfo(entityKey)

  const { result } = useAsync(async () => {
    if (iotInfoAcc) {
      return parseH3BNLocation(iotInfoAcc.info.location).reverse()
    }

    if (mobileInfoAcc) {
      return parseH3BNLocation(mobileInfoAcc.info.location).reverse()
    }
  }, [hotspot])

  if (!result) return null

  return (
    <MarkerView
      key={hotspot.id}
      id={hotspot.id}
      coordinate={result}
      allowOverlapWithPuck
    >
      <ImageBox source={require('@assets/images/hotspotBlackMarker.png')} />
    </MarkerView>
  )
}

export default ExplorerPage
