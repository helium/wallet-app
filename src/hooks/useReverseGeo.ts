import axios from 'axios'
import { Config } from 'react-native-config'
import { useAsync } from 'react-async-hook'

export const useReverseGeo = (coords: number[] | undefined) =>
  useAsync(async () => {
    const response = await reverseGeoCode(coords)
    if (!response) return ''

    const placeName = response.data.features[0].place_name
    const parts = placeName.split(',')
    const address = parts[0]
    const city = parts[parts.length - 3]
    const state = parts[parts.length - 2].split(' ')[1]

    return `${address}, ${city}, ${state}`
  }, [coords])

export const reverseGeoCode = async (coords: number[] | undefined) => {
  if (!coords) return

  return axios.get<undefined, { data: Geo }>(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${Config.MAPBOX_ACCESS_TOKEN}`,
  )
}

export interface Geo {
  type: string
  query: number[]
  features: Feature[]
  attribution: string
}

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
  mapbox_id: string
  wikidata?: string
  short_code?: string
}

export interface Geometry {
  type: string
  coordinates: number[]
}

export interface Context {
  id: string
  mapbox_id: string
  text: string
  wikidata?: string
  short_code?: string
}
