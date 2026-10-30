import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

export const useForwardGeo = () => {
  const { t } = useTranslation()
  const {
    error,
    isPending: loading,
    mutateAsync: execute,
  } = useMutation({
    mutationFn: async (searchText: string) => {
      if (!searchText) return

      const response = await axios.get(
        `https://photon.komoot.io/api/?q=${searchText}`,
      )

      if (!response || !response.data || response.data.features.length === 0) {
        throw new Error(t('generic.noData'))
      }

      return response.data.features[0].geometry?.coordinates as [number, number]
    },
  })

  return { error, loading, execute }
}
