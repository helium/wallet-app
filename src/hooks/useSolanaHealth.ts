import { WrappedConnection } from '@utils/WrappedConnection'
import { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { getCurrentTPS } from '../utils/solanaUtils'

let lastUpdated = 0
function doTimeout() {
  // Re-do every 5 minutes
  if (new Date().valueOf() - lastUpdated > 60 * 1000 * 5) {
    cachedHealthByEndpoint = {}
    cachedTps = {}
    lastUpdated = new Date().valueOf()
  }
}
let cachedHealthByEndpoint: Record<string, Promise<any>> = {}
async function getCachedHealth(connection: WrappedConnection): Promise<any> {
  doTimeout()
  if (!cachedHealthByEndpoint[connection.rpcEndpoint]) {
    cachedHealthByEndpoint[connection.rpcEndpoint] = connection.getHealth()
  }

  return (await cachedHealthByEndpoint[connection.rpcEndpoint]).result
}

let cachedTps: Record<string, Promise<any>> = {}
async function getCachedTPS(connection: WrappedConnection): Promise<any> {
  doTimeout()
  if (!cachedTps[connection.rpcEndpoint]) {
    cachedTps[connection.rpcEndpoint] = getCurrentTPS(connection)
  }

  return cachedTps[connection.rpcEndpoint]
}

const useSolanaHealth = () => {
  const { anchorProvider } = useSolana()
  const [isHealthy, setIsHealthy] = useState(true)
  const [slowTps, setSlowTps] = useState<number | undefined>()

  const { t } = useTranslation()

  const connection = useMemo(() => {
    if (!anchorProvider) return
    return anchorProvider.connection as WrappedConnection
  }, [anchorProvider])

  useAsync(async () => {
    if (!connection) return
    const { result: health } = await getCachedHealth(connection)
    setIsHealthy(health === 'ok')
  }, [connection])

  useAsync(async () => {
    if (!connection) return
    const currentTps = await getCachedTPS(connection)
    // If the current tps is less than or equal to 2000, we consider it unhealthy
    if (currentTps <= 2000) {
      setIsHealthy(false)
      setSlowTps(currentTps)
    }
  }, [connection])

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
