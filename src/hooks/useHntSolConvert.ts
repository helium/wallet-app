import { useOwnedAmount, useSolOwnedAmount } from '@helium/helium-react-hooks'
import { HNT_MINT } from '@helium/spl-utils'
import { LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js'
import axios from 'axios'
import BN from 'bn.js'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { Config } from 'react-native-config'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'
import { useBN } from './useBN'
import { useCurrentWallet } from './useCurrentWallet'

export function useHntSolConvert() {
  const { cluster, anchorProvider } = useSolana()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const hntBalance = useBN(useOwnedAmount(wallet, HNT_MINT).amount)

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
      return new BN(estimate)
    } catch (e) {
      logger.error(e)
      return 0
    }
  }, [baseUrl])

  const hasEnoughHNTForSol = useMemo(() => {
    if (!hntBalance || !hntEstimate) return false

    return hntBalance.gt(hntEstimate)
  }, [hntBalance, hntEstimate])

  const hasEnoughSol = useMemo(() => {
    return (solBalance || new BN(0)).gt(new BN(0.02 * LAMPORTS_PER_SOL))
  }, [solBalance])

  const {
    result: hntSolConvertTransaction,
    loading: hntSolConvertTransactionLoading,
    error: hntSolConvertTransactionError,
  } = useAsync(async () => {
    if (!anchorProvider || hasEnoughSol) return

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
  }, [baseUrl, hasEnoughSol, anchorProvider])

  return {
    hntSolConvertTransaction,
    hntSolConvertTransactionLoading,
    hntSolConvertTransactionError,
    hntEstimate,
    hntEstimateLoading,
    hntEstimateError,
    hasEnoughSol,
    hasEnoughHNTForSol,
  }
}
