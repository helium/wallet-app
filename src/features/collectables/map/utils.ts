import { ViewProps } from 'react-native'

export const MIN_MAP_ZOOM = 2
export const MAX_MAP_ZOOM = 18

export const INITIAL_MAP_VIEW_STATE: {
  centerCoordinate: [number, number]
  zoomLevel: number
  animationDuration: number
} = {
  centerCoordinate: [-122.419418, 37.774929],
  zoomLevel: 12,
  animationDuration: 500,
}

export const MAP_CONTAINER_STYLE: ViewProps['style'] = {
  flex: 1,
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: 'rgb(19,24,37)',
}
