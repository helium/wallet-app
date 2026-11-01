// A stand-in for @maplibre/maplibre-react-native, which needs native modules
// and so cannot load under jest. Use it with
// jest.mock('@maplibre/maplibre-react-native', () =>
//   jest.requireActual('./mapLibreMock'))
// and drive the ref methods through the jest.fn()s exported here.
import type { CameraRef, MapRef } from '@maplibre/maplibre-react-native'
import React, {
  PropsWithChildren,
  forwardRef,
  useImperativeHandle,
} from 'react'

export const mockMapRef = {
  getCenter: jest.fn(),
  getZoom: jest.fn(),
} satisfies Pick<MapRef, 'getCenter' | 'getZoom'>

export const mockCameraRef = {
  setStop: jest.fn(),
} satisfies Pick<CameraRef, 'setStop'>

export const Map = forwardRef<typeof mockMapRef, PropsWithChildren>(
  (props, ref) => {
    useImperativeHandle(ref, () => mockMapRef)
    return React.createElement('Map', props)
  },
)

export const Camera = forwardRef<typeof mockCameraRef>((props, ref) => {
  useImperativeHandle(ref, () => mockCameraRef)
  return React.createElement('Camera', props)
})

export const UserLocation = 'UserLocation'
export const Marker = 'Marker'
export const Images = 'Images'
export const Layer = 'Layer'
export const GeoJSONSource = 'GeoJSONSource'
export const useCurrentPosition = jest.fn()
