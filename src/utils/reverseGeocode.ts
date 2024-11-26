import { useAsync } from 'react-async-hook'
import Config from 'react-native-config'

const reverseGeocode = async ({
  token,
  lat,
  lng,
}: {
  token: string
  lat: number
  lng: number
}) => {
  if (!lat || !lng) return

  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
  const response = await fetch(endpoint)
  const results = (await response.json()) as { features: Feature[] }
  const features = (results?.features || []) as Feature[]
  if (!features.length) return

  return features[0]
}

export const useReverseGeo = (lat?: number, lng?: number) => {
  return useAsync(async () => {
    if (!Config.MAPBOX_ACCESS_TOKEN || !lat || !lng) return
    return reverseGeocode({ token: Config.MAPBOX_ACCESS_TOKEN, lat, lng })
  }, [lat, lng])
}

export default reverseGeocode

export interface Feature {
  id: string
  type: string
  place_type: string[]
  relevance: number
  properties: Properties
  text: string
  place_name: string
  center: number[]
  geometry: Geometry
  address?: string
  context?: Context[]
  bbox?: number[]
}

export interface Properties {
  accuracy?: string
  mapbox_id?: string
  wikidata?: string
  short_code?: string
}

export interface Geometry {
  type: string
  coordinates: number[]
}

export interface Context {
  id: string
  mapbox_id?: string
  text: string
  wikidata?: string
  short_code?: string
}
