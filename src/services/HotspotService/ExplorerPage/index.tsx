import Box from '@components/Box'
import Map from '@components/Map'
import { Camera } from '@rnmapbox/maps'
import React from 'react'

const ExplorerPage = () => {
  return (
    <Box flex={1}>
      <Map>
        <Camera
          zoomLevel={0}
          maxZoomLevel={22}
          pitch={0}
          centerCoordinate={[-74.00597, 40.71427]}
        />
      </Map>
    </Box>
  )
}

export default ExplorerPage
