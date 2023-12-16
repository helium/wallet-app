import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { useMint } from '@helium/helium-react-hooks'
import {
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  sendAndConfirmWithRetry,
  toNumber,
} from '@helium/spl-utils'
import { useEcosystemTokenSolConvert } from '@hooks/useEcosystemTokensSolConvert'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import BN from 'bn.js'
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from 'react-native-gesture-handler'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import * as Logger from '../../utils/logger'

const InsufficientSolConversionModal: FC = () => {
  const { t } = useTranslation()
  const { anchorProvider } = useSolana()
  const { hideModal, onCancel, onSuccess } = useModal()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const [inputMint, setInputMint] = useState<PublicKey | undefined>()
  const { symbol } = useMetaplexMetadata(inputMint)
  const [transactionError, setTransactionError] = useState<string>()
  const [swapping, setSwapping] = useState(false)
  const { visibleTokens } = useVisibleTokens()
  const {
    loading,
    error: solConvertError,
    estimatesByMint,
    hasEnoughForSolByMint,
    solConvertTxByMint,
  } = useEcosystemTokenSolConvert()
  const [useAuto, setUseAuto] = useState(false)
  const { updateAutoGasManagementToken } = useAppStorage()

  const inputMintDecimals = useMint(inputMint)?.info?.decimals

  const validInputMints = useMemo(
    () =>
      [HNT_MINT, MOBILE_MINT, IOT_MINT].filter((key) =>
        visibleTokens.has(key.toBase58()),
      ),
    [visibleTokens],
  )

  const hasAtLeastOne = useMemo(
    () =>
      Object.entries(hasEnoughForSolByMint).some(([_mint, value]) =>
        Boolean(value),
      ),
    [hasEnoughForSolByMint],
  )

  const inputAmount = useMemo(() => {
    if (
      estimatesByMint &&
      inputMint &&
      estimatesByMint[inputMint.toBase58()] &&
      typeof inputMintDecimals !== 'undefined'
    ) {
      return toNumber(
        new BN(Number(estimatesByMint[inputMint.toBase58()] || 0)),
        inputMintDecimals,
      )
    }

    return 0
  }, [inputMint, inputMintDecimals, estimatesByMint])

  const swapTx = useMemo(() => {
    if (inputMint) {
      return solConvertTxByMint[inputMint.toBase58()]
    }
  }, [inputMint, solConvertTxByMint])

  useEffect(() => {
    if (hasAtLeastOne) {
      const [[firstMint]] = Object.entries(hasEnoughForSolByMint).filter(
        ([_mint, value]) => Boolean(value),
      )

      if (firstMint) {
        setInputMint(new PublicKey(firstMint))
      }
    }
  }, [hasAtLeastOne, setInputMint, hasEnoughForSolByMint])

  const onMintSelect = useCallback(
    (mint: PublicKey) => () => {
      setInputMint(mint)
      setTransactionError(undefined)
    },
    [],
  )

  const handleSwapTokens = useCallback(async () => {
    if (!anchorProvider || !swapTx) return

    try {
      if (useAuto) {
        await updateAutoGasManagementToken(inputMint)
      }
      setSwapping(true)
      const signed = await anchorProvider.wallet.signTransaction(swapTx)
      await sendAndConfirmWithRetry(
        anchorProvider.connection,
        Buffer.from(signed.serialize()),
        {
          skipPreflight: true,
        },
        'confirmed',
      )

      hideModal()
      if (onSuccess) await onSuccess()
    } catch (error) {
      setSwapping(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }, [
    anchorProvider,
    swapTx,
    useAuto,
    hideModal,
    onSuccess,
    updateAutoGasManagementToken,
    inputMint,
  ])

  const handleCancel = useCallback(async () => {
    hideModal()
    if (onCancel) await onCancel()
  }, [onCancel, hideModal])

  const showError = useMemo(() => {
    if (solConvertError) return t('generic.somethingWentWrong')
    if (transactionError) return transactionError
  }, [t, transactionError, solConvertError])

  return (
    <ReAnimatedBlurBox
      visible
      entering={FadeInFast}
      position="absolute"
      zIndex={9999}
      height="100%"
      width="100%"
      paddingBottom="xl"
    >
      <SafeAreaBox edges={edges} flex={1}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          paddingTop="s"
          paddingHorizontal="m"
        >
          <Text variant="h4" color="white" flex={1} textAlign="center">
            {t('insufficientSolConversionModal.title')}
          </Text>
        </Box>
        <Box flex={1} paddingHorizontal="m" marginTop="l">
          <Text
            variant="body1Medium"
            color="white"
            opacity={0.6}
            textAlign="center"
          >
            {t('insufficientSolConversionModal.body')}
          </Text>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginTop="xxl"
          >
            {validInputMints.map((mint) => (
              <TokenPill
                key={mint.toBase58()}
                mint={mint}
                isActive={inputMint?.equals(mint)}
                isDisabled={!hasEnoughForSolByMint[mint.toBase58()]}
                onPress={onMintSelect(mint)}
              />
            ))}
          </Box>
          <Box flex={1} marginTop="xxl" alignItems="center">
            {loading && <CircleLoader loaderSize={30} color="white" />}
            {!loading && !hasAtLeastOne && (
              <Box justifyContent="center" alignItems="center" marginTop="xxl">
                <Text variant="body2Medium" color="white" textAlign="center">
                  {t('insufficientSolConversionModal.noBalance')}
                </Text>
              </Box>
            )}
            {!loading && hasAtLeastOne && (
              <>
                <Box
                  justifyContent="center"
                  alignItems="center"
                  marginTop="xxl"
                >
                  <Text
                    variant="body3"
                    color="white"
                    opacity={0.6}
                    marginBottom="xs"
                  >
                    {t('swapsScreen.youPay')}
                  </Text>
                  <Box flexDirection="row">
                    <Text marginEnd="s" variant="h4">
                      {inputAmount}
                    </Text>
                    <Text variant="h4" color="white" opacity={0.6}>
                      {symbol}
                    </Text>
                  </Box>
                </Box>
                <Box
                  marginTop="xxl"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text
                    variant="body3"
                    color="white"
                    opacity={0.6}
                    marginBottom="xs"
                  >
                    {t('swapsScreen.youReceive')}
                  </Text>
                  <Box flexDirection="row">
                    <Text marginEnd="s" variant="h4">
                      ~0.02
                    </Text>
                    <Text variant="h4" color="white" opacity={0.6}>
                      SOL
                    </Text>
                  </Box>
                </Box>
                <Text
                  opacity={transactionError || solConvertError ? 100 : 0}
                  marginHorizontal="m"
                  variant="body3Medium"
                  marginBottom="l"
                  color="red500"
                >
                  {showError}
                </Text>
              </>
            )}
          </Box>
        </Box>
        <Box
          flexDirection="row"
          paddingHorizontal="m"
          marginBottom="l"
          marginTop="xxl"
          alignItems="center"
        >
          <Switch
            value={useAuto}
            trackColor={{ false: 'secondaryText', true: 'blueBright500' }}
            thumbColor="primaryBackground"
            onValueChange={() => setUseAuto((ua) => !ua)}
          />
          <Box flex={1}>
            <Text ml="m" color="white">
              {t('insufficientSolConversionModal.useAuto')}
            </Text>
          </Box>
        </Box>
        {!loading && (
          <Box
            flexDirection="row"
            marginHorizontal="m"
            justifyContent="space-between"
          >
            <ButtonPressable
              width={hasAtLeastOne ? '48%' : '100%'}
              borderRadius="round"
              backgroundColor="black400"
              backgroundColorOpacityPressed={0.05}
              titleColorPressedOpacity={0.3}
              titleColor="white"
              title={t('generic.cancel')}
              disabled={loading}
              onPress={handleCancel}
            />
            {hasAtLeastOne && (
              <ButtonPressable
                width="48%"
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="secondaryBackground"
                titleColorDisabled="secondaryText"
                titleColor="black"
                disabled={!inputMint}
                titleColorPressedOpacity={0.3}
                title={swapping ? '' : t('generic.swap')}
                onPress={handleSwapTokens}
                TrailingComponent={
                  swapping ? (
                    <CircleLoader loaderSize={20} color="black" />
                  ) : undefined
                }
              />
            )}
          </Box>
        )}
      </SafeAreaBox>
    </ReAnimatedBlurBox>
  )
}

export default memo(() => {
  const { type } = useModal()

  if (type !== 'InsufficientSolConversion') return null
  return <InsufficientSolConversionModal />
})
