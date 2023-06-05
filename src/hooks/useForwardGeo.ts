import axios from 'axios'
import { Config } from 'react-native-config'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'

export const useForwardGeo = () => {
  const { t } = useTranslation()
  const { error, loading, execute } = useAsyncCallback(
    async (searchText: string) => {
      if (!searchText) return

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?access_token=${Config.MAPBOX_ACCESS_TOKEN}`,
      )

      if (!response || !response.data || response.data.features.length === 0) {
        throw new Error(t('generic.noData'))
      }

      return response.data.features[0].geometry?.coordinates as [number, number]
    },
  )

  return { error, loading, execute }
}
