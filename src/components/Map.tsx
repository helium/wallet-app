import Mapbox from '@rnmapbox/maps'
import { HELIUM_WORLD_NO_LABELS } from '@utils/constants'
import React, { forwardRef } from 'react'

const Map = forwardRef<
  Mapbox.MapView,
  React.ComponentProps<typeof Mapbox.MapView> & { children?: React.ReactNode }
>(({ children, ...rest }, ref) => {
  return (
    <Mapbox.MapView
      ref={ref}
      style={{ flex: 1 }}
      logoEnabled={false}
      styleURL={HELIUM_WORLD_NO_LABELS}
      projection="globe"
      compassEnabled={false}
      scaleBarEnabled={false}
      attributionEnabled={false}
      {...rest}
    >
      {children}
    </Mapbox.MapView>
  )
})

export default Map
