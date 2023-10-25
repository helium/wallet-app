import CloseCircle from '@assets/images/closeCircleFilled.svg'
import Warning from '@assets/images/warning.svg'
import {
  useMint,
  useOwnedAmount,
  useSolOwnedAmount,
} from '@helium/helium-react-hooks'
import { toNumber } from '@helium/spl-utils'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import {
  Connection,
  VersionedTransaction,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Theme } from '@theme/theme'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import axios from 'axios'
import BN from 'bn.js'
import React, { useCallback, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import Config from 'react-native-config'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { appSlice } from '../store/slices/appSlice'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'
import CircleLoader from './CircleLoader'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'

const MIN_HEIGHT = 52

type BannerProps = {
  onLayout?: (event: LayoutChangeEvent) => void
} & BoxProps<Theme>

const Banner = ({ onLayout, ...rest }: BannerProps) => {
  const dispatch = useDispatch()
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
  const needsSwap = useMemo(
    () =>
      autoGasManagementToken &&
      anchorProvider &&
      typeof decimals !== 'undefined' &&
      solBalance &&
      solBalance <= MIN_BALANCE_THRESHOLD,
    [solBalance, autoGasManagementToken, anchorProvider, decimals],
  )
  const baseUrl = useMemo(() => {
    let url = Config.TOKENS_TO_RENT_SERVICE_DEVNET_URL
    if (cluster === 'mainnet-beta') {
      url = Config.TOKENS_TO_RENT_SERVICE_URL
    }

    return url
  }, [cluster])
  const { amount: tokenBalance } = useOwnedAmount(
    anchorProvider?.wallet.publicKey,
    autoGasManagementToken,
  )
  const { loading, error } = useAsync(async () => {
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
        setAmount(toNumber(estimate, decimals))

        const txRaw = (
          await axios.post(`${baseUrl}/fees`, {
            wallet: anchorProvider.publicKey.toBase58(),
            mint: autoGasManagementToken,
          })
        ).data

        const tx = VersionedTransaction.deserialize(Buffer.from(txRaw))
        const signed = await anchorProvider.wallet.signTransaction(tx)
        const serializedTx = Buffer.from(signed.serialize())
        const decision = await walletSignBottomSheetRef.show({
          type: WalletStandardMessageTypes.signTransaction,
          url: '',
          additionalMessage: t('transactions.autoGasConvert', { symbol }),
          serializedTxs: [serializedTx],
          header: t('transactions.autoGasConvertHeader'),
        })
        if (decision) {
          await sendAndConfirmRawTransaction(
            anchorProvider.connection,
            serializedTx,
          )
        }
      }

      setAmount(undefined)
    }
  }, [
    needsSwap,
    autoGasManagementToken,
    walletSignBottomSheetRef,
    anchorProvider,
    decimals,
    tokenBalance,
  ])
  const swapping = useMemo(
    () => Boolean(autoGasManagementToken && needsSwap && loading),
    [autoGasManagementToken, needsSwap, loading],
  )

  const bannerTopMargin = useMemo(() => {
    return top === 0 && initialWindowMetrics?.insets
      ? initialWindowMetrics?.insets.top
      : top
  }, [top])

  const bannerAnimatedStyles = useAnimatedStyle(() => {
    // Animate margin
    return {
      marginTop: withTiming(0),
      paddingTop: bannerTopMargin,
    }
  }, [bannerTopMargin])

  const handleBannerClose = useCallback(() => {
    dispatch(appSlice.actions.setShowBanner(false))
  }, [dispatch])

  return (
    <ReAnimatedBox
      visible={swapping}
      backgroundColor="black650"
      style={bannerAnimatedStyles}
      onLayout={onLayout}
      {...rest}
    >
      <Box
        minHeight={MIN_HEIGHT}
        padding="s"
        paddingHorizontal="m"
        flexDirection="row"
        alignItems="center"
      >
        <Box>
          {error ? (
            <Warning width={24} height={24} />
          ) : (
            <CircleLoader loaderSize={24} />
          )}
        </Box>
        <Text
          variant="body2"
          marginStart="s"
          flex={1}
          adjustsFontSizeToFit
          textAlign="center"
        >
          {error
            ? `Auto Gas Error: ${error.toString()}`
            : t('generic.swappingSol', {
                symbol,
                amount,
              })}
        </Text>
        <TouchableOpacityBox onPress={handleBannerClose}>
          <CloseCircle width={24} height={24} />
        </TouchableOpacityBox>
      </Box>
    </ReAnimatedBox>
  )
}

export default Banner
