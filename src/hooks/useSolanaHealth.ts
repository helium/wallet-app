import { WrappedConnection } from '@utils/WrappedConnection'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { getCurrentTPS } from '../utils/solanaUtils'

// Health and TPS drive a warning banner, not data anything signs, so each
// endpoint is probed at most once every 5 minutes
const HEALTH_STALE_TIME_MS = 5 * 60_000

export const solanaHealthQuery = (connection?: WrappedConnection) =>
  queryOptions({
    queryKey: ['solanaHealth', connection?.rpcEndpoint],
    queryFn: async (): Promise<string | null> => {
      const health = await connection!.getHealth()
      if (!health) throw new Error('getHealth failed')
      return health.result ?? null
    },
    staleTime: HEALTH_STALE_TIME_MS,
    enabled: !!connection,
  })

export const solanaTpsQuery = (connection?: WrappedConnection) =>
  queryOptions({
    queryKey: ['solanaTps', connection?.rpcEndpoint],
    queryFn: () => getCurrentTPS(connection!),
    staleTime: HEALTH_STALE_TIME_MS,
    enabled: !!connection,
  })

const useSolanaHealth = () => {
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()

  const connection = useMemo(() => {
    if (!anchorProvider) return
    return anchorProvider.connection as WrappedConnection
  }, [anchorProvider])

  const { data: health } = useQuery(solanaHealthQuery(connection))
  const { data: tps } = useQuery(solanaTpsQuery(connection))

  // If the current tps is less than or equal to 2000, we consider it unhealthy
  const slowTps = tps !== undefined && tps <= 2000 ? tps : undefined
  const isHealthy =
    (health === undefined || health === 'ok') && slowTps === undefined

  const healthMessage = useMemo(() => {
    if (isHealthy) return t('generic.solanaHealthy')

    if (slowTps) {
      return t('generic.solanaTpsSlow', {
        tps: slowTps.toFixed(2),
      })
    }
    return t('generic.solanaHealthDown')
  }, [isHealthy, t, slowTps])

  return {
    isHealthy,
    healthMessage,
  }
}

export default useSolanaHealth
