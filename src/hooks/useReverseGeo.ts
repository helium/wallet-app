import axios from 'axios'
import { Config } from 'react-native-config'
import { useAsync } from 'react-async-hook'

export const useReverseGeo = (coords: number[] | undefined) =>
  useAsync(async () => {
    if (!coords) return ''

    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${Config.MAPBOX_ACCESS_TOKEN}`,
    )

    const placeName = response.data.features[0].place_name
    const parts = placeName.split(',')
    const address = parts[0]
    const city = parts[parts.length - 3]
    const state = parts[parts.length - 2].split(' ')[1]

    return `${address}, ${city}, ${state}`
  }, [coords])
