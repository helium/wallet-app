import { useAppStorage } from '@storage/AppStorageProvider'
import { getConnection } from '@utils/solanaUtils'
import { useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'

const useSolanaHealth = () => {
  const { solanaNetwork: cluster } = useAppStorage()
  const [isHealthy, setIsHealthy] = useState(true)
  const dispatch = useAppDispatch()
  const [error, setError] = useState<
    | {
        code: number
        message: string
        data: {
          numSlotsBehind?: number
        }
      }
    | undefined
  >(undefined)

  const { t } = useTranslation()

  const connection = useMemo(() => {
    if (!cluster) return
    return getConnection(cluster)
  }, [cluster])

  useAsync(async () => {
    if (!connection) return
    const { result: health, error: healthError } = await connection.getHealth()
    setIsHealthy(health === 'ok')
    setError(healthError)
  }, [connection])

  const healthMessage = useMemo(() => {
    if (isHealthy) return t('generic.solanaHealthy')

    if (error?.data?.numSlotsBehind) {
      return t('generic.solanaHealthBlocksBehind', {
        blocksBehind: error.data.numSlotsBehind,
      })
    }
    return t('generic.solanaHealthDown')
  }, [isHealthy, t, error])

  useEffect(() => {
    if (isHealthy) return
    dispatch(appSlice.actions.setShowBanner(true))
  }, [dispatch, isHealthy])

  return {
    isHealthy,
    healthMessage,
  }
}

export default useSolanaHealth
