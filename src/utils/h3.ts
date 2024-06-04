import { latLngToCell, cellToLatLng, cellToBoundary } from 'h3-js'
import { BN } from '@coral-xyz/anchor'

export const DEFAULT_H3_RES = 12

/**
 * Returns the H3 Hex of a lat lng location at a specific resolution.
 * The default resolution is 12. See [Uber H3](https://github.com/uber/h3)
 * for more info.
 * @param lat
 * @param lng
 * @param res
 */
export const getH3Location = (lat: number, lng: number, res = DEFAULT_H3_RES) =>
  latLngToCell(lat, lng, res)

export const parseH3BNLocation = (location: BN) =>
  cellToLatLng(location.toString('hex'))

export const parseH3BNBoundary = (location: BN) => {
  return cellToBoundary(location.toString('hex'))
}
