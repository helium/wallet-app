import {
  useMint,
  useOwnedAmount,
  useSolOwnedAmount,
} from '@helium/helium-react-hooks'
import { toNumber } from '@helium/spl-utils'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useSubmitAndAwait } from '@hooks/useSubmitAndAwait'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { toTransactionData, hashTagParams } from '@utils/transactionUtils'
import axios from 'axios'
import BN from 'bn.js'
import { CircleX, TriangleAlert } from 'lucide-react-native'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
import Config from '@utils/config'
import Animated from 'react-native-reanimated'
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useAppStore } from '../store/appStore'
import { PressableScale } from './PressableScale'
import { Spinner } from './Spinner'
import { Text } from './Text'
import { twMerge } from './twMerge'

const WarningIcon = withUniwind(TriangleAlert)
const CloseIcon = withUniwind(CircleX)

type BannerProps = {
  onLayout?: (event: LayoutChangeEvent) => void
  className?: string
}

const Banner = ({ onLayout, className }: BannerProps) => {
  const setShowBanner = useAppStore((state) => state.setShowBanner)
  const { top } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { autoGasManagementToken } = useAppStorage()
  const { symbol } = useMetaplexMetadata(autoGasManagementToken)
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const { cluster, anchorProvider } = useSolana()
  const { amount: solBalance } = useSolOwnedAmount(
    anchorProvider?.wallet.publicKey,
  )
  const decimals = useMint(autoGasManagementToken)?.info?.decimals
  const { walletSignBottomSheetRef } = useWalletSign()
  const { submitAndAwait } = useSubmitAndAwait()
  const needsSwap =
    autoGasManagementToken &&
    anchorProvider &&
    typeof decimals !== 'undefined' &&
    solBalance &&
    solBalance <= MIN_BALANCE_THRESHOLD
  const baseUrl =
    cluster === 'mainnet-beta'
      ? Config.TOKENS_TO_RENT_SERVICE_URL
      : Config.TOKENS_TO_RENT_SERVICE_DEVNET_URL
  const { amount: tokenBalance } = useOwnedAmount(
    anchorProvider?.wallet.publicKey,
    autoGasManagementToken,
  )
  // Signs and submits a swap, so it runs as an effect, not as a cached query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const swapInFlight = useRef<Promise<void> | undefined>(undefined)
  const swapForGas = useEffectEvent(async () => {
    const runSwap = async () => {
      if (
        needsSwap &&
        autoGasManagementToken &&
        anchorProvider &&
        typeof decimals !== 'undefined' &&
        walletSignBottomSheetRef
      ) {
        // Check balance again, sometimes token balance change comes thru before sol change and we
        // get a duplicate request
        const cachelessConn = new Connection(
          anchorProvider.connection.rpcEndpoint,
          'confirmed',
        )
        const balance = (
          await cachelessConn.getAccountInfo(anchorProvider?.wallet.publicKey)
        )?.lamports
        if (balance && balance > MIN_BALANCE_THRESHOLD) {
          return
        }
        const estimates: { [key: string]: string } = (
          await axios.get(`${baseUrl}/estimates`)
        ).data

        const estimate = new BN(estimates[autoGasManagementToken.toBase58()])
        if ((tokenBalance || 0) > estimate.toNumber()) {
          const swapAmount = toNumber(estimate, decimals)
          setAmount(swapAmount)

          const txRaw = (
            await axios.post(`${baseUrl}/fees`, {
              wallet: anchorProvider.publicKey.toBase58(),
              mint: autoGasManagementToken,
            })
          ).data

          const tx = VersionedTransaction.deserialize(Buffer.from(txRaw))
          const serializedTx = Buffer.from(tx.serialize())
          const decision = await walletSignBottomSheetRef.show({
            type: WalletStandardMessageTypes.signTransaction,
            url: '',
            message: t('transactions.autoGasConvert', { symbol }),
            serializedTxs: [serializedTx],
            header: t('transactions.autoGasConvertHeader'),
          })
          if (decision) {
            const walletAddress = anchorProvider.wallet.publicKey.toBase58()
            const mintAddress = autoGasManagementToken.toBase58()
            const paramsHash = hashTagParams({
              wallet: walletAddress,
              mint: mintAddress,
              amount: swapAmount,
            })
            const tag = `auto-gas-${paramsHash}`
            const transactionData = toTransactionData([tx], {
              tag,
              metadata: { type: 'swap', description: 'Auto Gas Conversion' },
            })
            await submitAndAwait({ transactionData })
          }
        }

        setAmount(undefined)
      }
    }
    if (swapInFlight.current) return swapInFlight.current
    const run = runSwap().finally(() => {
      swapInFlight.current = undefined
    })
    swapInFlight.current = run
    return run
  })
  useEffect(() => {
    let current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the loader for the swap this effect starts
    setLoading(true)
    setError(undefined)
    swapForGas()
      .catch((e) => current && setError(e))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
  }, [
    needsSwap,
    autoGasManagementToken,
    walletSignBottomSheetRef,
    anchorProvider,
    decimals,
    tokenBalance,
    submitAndAwait,
    symbol,
    t,
    baseUrl,
  ])
  const swapping = Boolean(autoGasManagementToken && needsSwap && loading)

  const bannerTopMargin =
    top === 0 && initialWindowMetrics?.insets
      ? initialWindowMetrics?.insets.top
      : top

  return (
    <Animated.View
      className={twMerge('bg-primary', !swapping && 'hidden', className)}
      style={{ paddingTop: bannerTopMargin }}
      onLayout={onLayout}
    >
      <View className="min-h-[52px] flex-row items-center px-4 py-2">
        <View>
          {error ? (
            <WarningIcon size={24} colorClassName="accent-warning-500" />
          ) : (
            <Spinner colorClassName="accent-primary-foreground" />
          )}
        </View>
        <Text
          className="ms-2 flex-1 text-center text-primary-foreground"
          adjustsFontSizeToFit
        >
          {error
            ? `Auto Gas Error: ${error.toString()}`
            : t('generic.swappingSol', {
                symbol,
                amount,
              })}
        </Text>
        <PressableScale feedback="opacity" onPress={() => setShowBanner(false)}>
          <CloseIcon size={24} colorClassName="accent-primary-foreground" />
        </PressableScale>
      </View>
    </Animated.View>
  )
}

export default Banner
