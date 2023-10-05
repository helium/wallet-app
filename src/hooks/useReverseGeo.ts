import axios from 'axios'
import { useAsync } from 'react-async-hook'

export const useReverseGeo = (coords: number[] | undefined) =>
  useAsync(async () => {
    if (!coords) return ''

    try {
      const response = await axios.get(
        `https://photon.komoot.io/reverse?lon=${coords[0]}&lat=${coords[1]}`,
      )
      const {
        properties: { city, state, street },
      } = response.data.features[0] || {}

      return `${street}, ${city}, ${state}`
    } catch (e: any) {
      console.error(e)
    }
  }, [coords])
