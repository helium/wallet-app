import axios from 'axios'
import { Config } from 'react-native-config'
import { useAsyncCallback } from 'react-async-hook'

export const useForwardGeo = () => {
  const { error, loading, execute } = useAsyncCallback(
    async (searchText: string) => {
      if (!searchText) return

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?access_token=${Config.MAPBOX_ACCESS_TOKEN}`,
      )

      return response.data.features[0].geometry.coordinates
    },
  )

  return { error, loading, execute }
}
