import type {
  CameraRef,
  CameraStop,
  LngLat,
  MapRef,
} from '@maplibre/maplibre-react-native'
import React, { forwardRef, useImperativeHandle } from 'react'

// Stands in for @maplibre/maplibre-react-native, whose native modules do not
// load under jest. A test mocks the package with
//   jest.mock('@maplibre/maplibre-react-native', () =>
//     jest.requireActual('./mapLibreMock'))
// and drives the handles below. The map's events are the props of the
// rendered 'MapLibreRN.Map' host element.

export const mapHandle = {
  getCenter: jest.fn<Promise<LngLat>, []>(),
  getZoom: jest.fn<Promise<number>, []>(),
} satisfies Pick<MapRef, 'getCenter' | 'getZoom'>

export const cameraHandle = {
  setStop: jest.fn<Promise<void>, [CameraStop]>(),
} satisfies Pick<CameraRef, 'setStop'>

export const Map = forwardRef<typeof mapHandle, object>((props, ref) => {
  useImperativeHandle(ref, () => mapHandle)
  return React.createElement('MapLibreRN.Map', props)
})

export const Camera = forwardRef<typeof cameraHandle, object>((props, ref) => {
  useImperativeHandle(ref, () => cameraHandle)
  return React.createElement('MapLibreRN.Camera', props)
})

export const UserLocation = 'MapLibreRN.UserLocation'
export const Marker = 'MapLibreRN.Marker'
export const Images = 'MapLibreRN.Images'
export const Layer = 'MapLibreRN.Layer'
export const GeoJSONSource = 'MapLibreRN.GeoJSONSource'

export const useCurrentPosition = jest.fn<
  { coords: { longitude: number; latitude: number } } | undefined,
  []
>()
