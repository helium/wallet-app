import { truthy } from '@helium/spl-utils'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const cache = new Map<string, Promise<string>>()

export const useReverseGeo = (coords: number[] | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['reverseGeo', coords?.join(',')],
    queryFn: async () => {
      if (!coords) return ''

      const cacheKey = coords.join(',')

      if (cache.has(cacheKey)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return cache.get(cacheKey)!
      }

      const request = axios
        .get(
          `https://photon.komoot.io/reverse?lon=${coords[0]}&lat=${coords[1]}`,
        )
        .then((response) => {
          const { city, state, street } =
            (response.data.features[0] || {}).properties || {}

          const address = [street, city, state].filter(truthy).join(', ')

          cache.delete(cacheKey) // Remove from cache after resolving

          return address
        })
        .catch((e) => {
          console.error(e)
          cache.delete(cacheKey) // Remove from cache after rejecting
          throw e
        })

      cache.set(cacheKey, request)

      return request
    },
  })

  return { result: data, loading: isLoading }
}
