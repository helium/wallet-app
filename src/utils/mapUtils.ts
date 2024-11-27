import { CameraPadding, CameraStop } from '@rnmapbox/maps'
import { ViewProps } from 'react-native'

export const MIN_MAP_ZOOM = 2
export const MAX_MAP_ZOOM = 18

type CameraBounds = CameraPadding & {
  ne: number[]
  sw: number[]
}

const WORLD_BOUNDS: CameraBounds = {
  ne: [-134.827109, 57.785781],
  sw: [129.767893, -30.955724],
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
}

export const INITIAL_MAP_VIEW_STATE: {
  centerCoordinate: [number, number]
  bounds: CameraBounds
  zoomLevel: number
  animationDuration: number
  cameraStop?: CameraStop
} = {
  centerCoordinate: [-122.419418, 37.774929],
  bounds: WORLD_BOUNDS,
  zoomLevel: 17,
  animationDuration: 500,
}

export const MAP_CONTAINER_STYLE: ViewProps['style'] = {
  flex: 1,
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: 'rgb(0,0,0)',
}
