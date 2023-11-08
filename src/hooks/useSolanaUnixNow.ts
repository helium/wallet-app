import { useEffect, useMemo, useState } from 'react'
import { Connection, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js'
import { useAsync } from 'react-async-hook'
import { useSolana } from '../solana/SolanaProvider'

export const useSolanaUnixNow = (refreshInterval = 10000) => {
  const { connection } = useSolana()
  const connectionWithoutCache = useMemo(() => {
    if (connection) {
      return new Connection(connection.rpcEndpoint)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection?.rpcEndpoint])
  const [refresh, setRefresh] = useState(0)

  const { result: unixTs } = useAsync(
    async (conn: Connection | undefined, _: number) => {
      if (conn) {
        const clock = await conn.getAccountInfo(SYSVAR_CLOCK_PUBKEY)
        return Number(clock?.data.readBigInt64LE(8 * 4))
      }
    },
    [connectionWithoutCache, refresh],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh((prev) => prev + 1)
    }, refreshInterval)

    return () => {
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return unixTs
}
