import { Config } from 'react-native-config'
import { useAsync } from 'react-async-hook'
import axios from 'axios'
import { Transaction } from '@solana/web3.js'
import { useMemo } from 'react'
import { useBalance } from '@utils/Balance'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'

export function useHntSolConvert() {
  const { cluster, anchorProvider } = useSolana()
  const { hntBalance, solBalance } = useBalance()

  const baseUrl = useMemo(() => {
    let url = Config.HNT_TO_RENT_SERVICE_DEVNET_URL
    if (cluster === 'mainnet-beta') {
      url = Config.HNT_TO_RENT_SERVICE_URL
    }

    return url
  }, [cluster])

  const {
    result: hntEstimate,
    loading: hntEstimateLoading,
    error: hntEstimateError,
  } = useAsync(async () => {
    try {
      const { estimate } = (await axios.get(`${baseUrl}/estimate`)).data
      return estimate
    } catch (e) {
      logger.error(e)
      return 0
    }
  }, [baseUrl])

  const {
    result: hntSolConvertTransaction,
    loading: hntSolConvertTransactionLoading,
    error: hntSolConvertTransactionError,
  } = useAsync(async () => {
    if (!anchorProvider) return
    try {
      const txRaw = (
        await axios.post(`${baseUrl}/hnt-to-fees`, {
          wallet: anchorProvider.publicKey.toBase58(),
        })
      ).data
      const tx = Transaction.from(Buffer.from(txRaw))
      return tx
    } catch (e) {
      logger.error(e)
    }
  }, [baseUrl])

  // TODO: Ask foundation if we should show hnt sol swap even if the user has 0 SOL?
  const hasEnoughSol = useMemo(() => {
    if (!hntBalance || !solBalance || !hntEstimate) return true
    return (
      hntBalance.floatBalance >= hntEstimate && solBalance.floatBalance < 0.02
    )
  }, [hntBalance, solBalance, hntEstimate])

  return {
    hntSolConvertTransaction,
    hntSolConvertTransactionLoading,
    hntSolConvertTransactionError,
    hntEstimate,
    hntEstimateLoading,
    hntEstimateError,
    hasEnoughSol,
  }
}
