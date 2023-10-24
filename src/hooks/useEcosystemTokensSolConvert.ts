import { useOwnedAmount } from '@helium/helium-react-hooks'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import BN from 'bn.js'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { Config } from 'react-native-config'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'
import { useBN } from './useBN'
import { useCurrentWallet } from './useCurrentWallet'

export const useEcosystemTokenSolConvert = () => {
  const { cluster, anchorProvider } = useSolana()
  const wallet = useCurrentWallet()
  const hntBalance = useBN(useOwnedAmount(wallet, HNT_MINT).amount)
  const mobileBalance = useBN(useOwnedAmount(wallet, MOBILE_MINT).amount)
  const iotBalance = useBN(useOwnedAmount(wallet, IOT_MINT).amount)

  const baseUrl = useMemo(() => {
    let url = Config.TOKENS_TO_RENT_SERVICE_DEVNET_URL
    if (cluster === 'mainnet-beta') {
      url = Config.TOKENS_TO_RENT_SERVICE_URL
    }

    return url
  }, [cluster])

  const {
    result: estimatesByMint,
    loading: estimatesByMintLoading,
    error: estimatesByMintError,
  } = useAsync(async () => {
    try {
      const estimates: { [key: string]: string } = (
        await axios.get(`${baseUrl}/estimates`)
      ).data

      return Object.entries(estimates).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: new BN(value),
        }),
        {},
      ) as { [key: string]: BN }
    } catch (e) {
      logger.error(e)
      return {
        [HNT_MINT.toBase58()]: 0,
        [MOBILE_MINT.toBase58()]: 0,
        [IOT_MINT.toBase58()]: 0,
      } as { [key: string]: 0 }
    }
  }, [baseUrl])

  const hasEnoughHntForSol = useMemo(() => {
    const estimate = estimatesByMint
      ? estimatesByMint[HNT_MINT.toBase58()]
      : undefined

    if (!hntBalance || !estimate) return false
    return hntBalance.gt(estimate)
  }, [hntBalance, estimatesByMint])

  const hasEnoughMobileForSol = useMemo(() => {
    const estimate = estimatesByMint
      ? estimatesByMint[MOBILE_MINT.toBase58()]
      : undefined

    if (!mobileBalance || !estimate) return false
    return mobileBalance.gt(estimate)
  }, [mobileBalance, estimatesByMint])

  const hasEnoughIotForSol = useMemo(() => {
    const estimate = estimatesByMint
      ? estimatesByMint[IOT_MINT.toBase58()]
      : undefined

    if (!iotBalance || !estimate) return false
    return iotBalance.gt(estimate)
  }, [iotBalance, estimatesByMint])

  const hasEnoughForSolByMint = useMemo(
    () => ({
      [HNT_MINT.toBase58()]: hasEnoughHntForSol,
      [MOBILE_MINT.toBase58()]: hasEnoughMobileForSol,
      [IOT_MINT.toBase58()]: hasEnoughIotForSol,
    }),
    [hasEnoughHntForSol, hasEnoughMobileForSol, hasEnoughIotForSol],
  )

  const {
    result: hntSolConvertTx,
    loading: hntSolConvertTxLoading,
    error: hntSolConvertTxError,
  } = useAsync(async () => {
    if (!anchorProvider || !hasEnoughHntForSol) return

    try {
      const txRaw = (
        await axios.post(`${baseUrl}/fees`, {
          wallet: anchorProvider.publicKey.toBase58(),
          mint: HNT_MINT.toBase58(),
        })
      ).data

      const tx = VersionedTransaction.deserialize(Buffer.from(txRaw))
      return tx
    } catch (e) {
      logger.error(e)
      throw e
    }
  }, [baseUrl, hasEnoughHntForSol, anchorProvider])

  const {
    result: mobileSolConvertTx,
    loading: mobileSolConvertTxLoading,
    error: mobileSolConvertTxError,
  } = useAsync(async () => {
    if (!anchorProvider || !hasEnoughMobileForSol) return

    try {
      const txRaw = (
        await axios.post(`${baseUrl}/fees`, {
          wallet: anchorProvider.publicKey.toBase58(),
          mint: MOBILE_MINT.toBase58(),
        })
      ).data

      const tx = VersionedTransaction.deserialize(Buffer.from(txRaw))
      return tx
    } catch (e) {
      logger.error(e)
    }
  }, [baseUrl, hasEnoughMobileForSol, anchorProvider])

  const {
    result: iotSolConvertTx,
    loading: iotSolConvertTxLoading,
    error: iotSolConvertTxError,
  } = useAsync(async () => {
    if (!anchorProvider || !hasEnoughIotForSol) return

    try {
      const txRaw = (
        await axios.post(`${baseUrl}/fees`, {
          wallet: anchorProvider.publicKey.toBase58(),
          mint: IOT_MINT.toBase58(),
        })
      ).data

      const tx = VersionedTransaction.deserialize(Buffer.from(txRaw))
      return tx
    } catch (e) {
      logger.error(e)
    }
  }, [baseUrl, hasEnoughIotForSol, anchorProvider])

  const solConvertTxByMint = useMemo(
    () => ({
      [HNT_MINT.toBase58()]: hntSolConvertTx,
      [MOBILE_MINT.toBase58()]: mobileSolConvertTx,
      [IOT_MINT.toBase58()]: iotSolConvertTx,
    }),
    [hntSolConvertTx, mobileSolConvertTx, iotSolConvertTx],
  )

  const loading = useMemo(
    () =>
      estimatesByMintLoading ||
      hntSolConvertTxLoading ||
      mobileSolConvertTxLoading ||
      iotSolConvertTxLoading,
    [
      estimatesByMintLoading,
      hntSolConvertTxLoading,
      mobileSolConvertTxLoading,
      iotSolConvertTxLoading,
    ],
  )

  const error = useMemo(
    () =>
      estimatesByMintError ||
      hntSolConvertTxError ||
      mobileSolConvertTxError ||
      iotSolConvertTxError,
    [
      estimatesByMintError,
      hntSolConvertTxError,
      mobileSolConvertTxError,
      iotSolConvertTxError,
    ],
  )

  return {
    loading,
    error,
    estimatesByMint,
    hasEnoughForSolByMint,
    solConvertTxByMint,
  }
}
