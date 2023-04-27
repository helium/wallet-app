import { WrappedConnection } from '@utils/WrappedConnection'
import { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { getCurrentTPS } from '../utils/solanaUtils'

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
    const { result: health } = await connection.getHealth()
    setIsHealthy(health === 'ok')
  }, [connection])

  useAsync(async () => {
    if (!anchorProvider) return
    const currentTps = await getCurrentTPS(anchorProvider)
    // If the highest mean_ms is greater than 10000ms, set unhealthy
    if (currentTps <= 2000) {
      setIsHealthy(false)
      setSlowTps(currentTps)
    }
  }, [])

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
