import { WrappedConnection } from '@utils/WrappedConnection'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'
import { useSolana } from '../solana/SolanaProvider'

type PingItem = {
  submitted: number
  confirmed: number
  loss: string
  mean_ms: number
  ts: string
  error_count: number
  error: string
}

const useSolanaHealth = () => {
  const { cluster, anchorProvider } = useSolana()
  const [isHealthy, setIsHealthy] = useState(true)
  const [slowPing, setSlowPing] = useState<PingItem | undefined>()
  const dispatch = useAppDispatch()

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
    const result = await axios(`https://ping.solana.com/${cluster}/last6hours`)

    if (result.data.length) {
      // Date 15 mins ago
      const now = new Date()
      now.setMinutes(now.getMinutes() - 15)

      // Only get results in the last 10 mins
      const last15Mins = result.data.filter(
        (item: PingItem) => new Date(item.ts) > now,
      )

      // Find the highest mean_ms
      const highestMean = last15Mins.reduce(
        (prev: PingItem, current: PingItem) =>
          prev.mean_ms > current.mean_ms ? prev : current,
      )

      // If the highest mean_ms is greater than 10000ms, set unhealthy
      if (highestMean.mean_ms > 10000) {
        setIsHealthy(false)
        setSlowPing(highestMean)
      }
    }
  }, [cluster])

  const healthMessage = useMemo(() => {
    if (isHealthy) return t('generic.solanaHealthy')

    if (slowPing) {
      return t('generic.solanaPingSlow', {
        mean_ms: slowPing.mean_ms,
        loss: slowPing.loss,
      })
    }
    return t('generic.solanaHealthDown')
  }, [isHealthy, t, slowPing])

  useEffect(() => {
    dispatch(appSlice.actions.setShowBanner(!isHealthy))
  }, [dispatch, isHealthy])

  return {
    isHealthy,
    healthMessage,
  }
}

export default useSolanaHealth
