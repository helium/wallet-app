import { useMint } from '@helium/helium-react-hooks'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useEcosystemTokenSolConvert } from '@hooks/useEcosystemTokensSolConvert'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useSubmitAndAwait } from '@hooks/useSubmitAndAwait'
import { PublicKey } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenPill } from '@ui/TokenPill'
import { toTransactionData, hashTagParams } from '@utils/transactionUtils'
import BN from 'bn.js'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BlurView } from 'expo-blur'
import { Platform, StyleSheet, Switch, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import { FADE_IN } from '@theme/motion'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)
const SafeArea = withUniwind(SafeAreaView)

const styles = StyleSheet.create({
  overlay: { zIndex: 9999 },
})

const InsufficientSolConversionModal: FC = () => {
  const { t } = useTranslation()
  const { anchorProvider } = useSolana()
  const { hideModal, onCancel, onSuccess } = useModal()
  const {
    submitAndAwait,
    isPending: swapping,
    error: submitError,
    reset: resetSubmit,
  } = useSubmitAndAwait()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const [inputMint, setInputMint] = useState<PublicKey | undefined>()
  const { symbol } = useMetaplexMetadata(inputMint)
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

  const [prevHasEnoughForSolByMint, setPrevHasEnoughForSolByMint] =
    useState<typeof hasEnoughForSolByMint>()
  if (prevHasEnoughForSolByMint !== hasEnoughForSolByMint) {
    setPrevHasEnoughForSolByMint(hasEnoughForSolByMint)
    if (hasAtLeastOne) {
      const [[firstMint]] = Object.entries(hasEnoughForSolByMint).filter(
        ([_mint, value]) => Boolean(value),
      )

      if (firstMint) {
        setInputMint(new PublicKey(firstMint))
      }
    }
  }

  const onMintSelect = useCallback(
    (mint: PublicKey) => () => {
      setInputMint(mint)
      resetSubmit()
    },
    [resetSubmit],
  )

  const handleSwapTokens = useCallback(async () => {
    if (!anchorProvider || !swapTx || !inputMint) return

    if (useAuto) {
      await updateAutoGasManagementToken(inputMint)
    }
    const walletAddress = anchorProvider.wallet.publicKey.toBase58()
    const paramsHash = hashTagParams({
      wallet: walletAddress,
      mint: inputMint.toBase58(),
      amount: inputAmount,
    })
    const tag = `sol-convert-${paramsHash}`
    const transactionData = toTransactionData([swapTx], {
      tag,
      metadata: { type: 'swap', description: 'SOL Conversion' },
    })

    const { signatures } = await submitAndAwait({ transactionData })

    if (signatures.length > 0) {
      hideModal()
      if (onSuccess) await onSuccess()
    }
  }, [
    anchorProvider,
    swapTx,
    inputMint,
    inputAmount,
    useAuto,
    hideModal,
    onSuccess,
    updateAutoGasManagementToken,
    submitAndAwait,
  ])

  const handleCancel = useCallback(async () => {
    hideModal()
    if (onCancel) await onCancel()
  }, [onCancel, hideModal])

  const showError = useMemo(() => {
    if (solConvertError) return t('generic.somethingWentWrong')
    if (submitError) return submitError.message
  }, [t, submitError, solConvertError])

  return (
    <>
      {/* This is because Android sucks and does not support expo blur and the experimental feature is trash :) */}
      {Platform.OS === 'android' && (
        <View className="absolute inset-0 z-0 bg-background" />
      )}
      <AnimatedBlurView
        entering={FADE_IN}
        style={[StyleSheet.absoluteFill, styles.overlay]}
        tint="light"
        intensity={80}
      >
        <View className="flex-1 pb-8">
          <SafeArea edges={edges} className="flex-1">
            <View className="flex-row items-center justify-center px-4 pt-2">
              <Text size="xl" className="flex-1 text-center">
                {t('insufficientSolConversionModal.title')}
              </Text>
            </View>
            <View className="mt-6 flex-1 px-4">
              <Text
                size="base"
                className="text-center font-medium text-muted-foreground"
              >
                {t('insufficientSolConversionModal.body')}
              </Text>
              <View className="mt-12 flex-row justify-between">
                {validInputMints.map((mint) => (
                  <TokenPill
                    key={mint.toBase58()}
                    mint={mint}
                    isActive={inputMint?.equals(mint)}
                    isDisabled={!hasEnoughForSolByMint[mint.toBase58()]}
                    onPress={onMintSelect(mint)}
                  />
                ))}
              </View>
              <View className="mt-12 flex-1 items-center">
                {loading && <Spinner size="large" />}
                {!loading && !hasAtLeastOne && (
                  <View className="mt-12 items-center justify-center">
                    <Text className="text-center font-medium">
                      {t('insufficientSolConversionModal.noBalance')}
                    </Text>
                  </View>
                )}
                {!loading && hasAtLeastOne && (
                  <>
                    <View className="mt-12 items-center justify-center">
                      <Text size="xs" className="mb-1 text-muted-foreground">
                        {t('swapsScreen.youPay')}
                      </Text>
                      <View className="flex-row">
                        <Text size="xl" className="me-2">
                          {inputAmount}
                        </Text>
                        <Text size="xl" className="text-muted-foreground">
                          {symbol}
                        </Text>
                      </View>
                    </View>
                    <View className="mt-12 items-center justify-center">
                      <Text size="xs" className="mb-1 text-muted-foreground">
                        {t('swapsScreen.youReceive')}
                      </Text>
                      <View className="flex-row">
                        <Text size="xl" className="me-2">
                          ~0.02
                        </Text>
                        <Text size="xl" className="text-muted-foreground">
                          SOL
                        </Text>
                      </View>
                    </View>
                    <Text
                      size="xs"
                      className={
                        submitError || solConvertError
                          ? 'mx-4 mb-6 font-medium text-destructive'
                          : 'mx-4 mb-6 font-medium text-destructive opacity-0'
                      }
                    >
                      {showError}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View className="mb-6 mt-12 flex-row items-center px-4">
              <Switch
                value={useAuto}
                trackColorOnClassName="accent-purple-500"
                trackColorOffClassName="accent-secondary"
                thumbColorClassName="accent-white"
                onValueChange={() => setUseAuto((ua) => !ua)}
              />
              <View className="flex-1">
                <Text className="ml-4">
                  {t('insufficientSolConversionModal.useAuto')}
                </Text>
              </View>
            </View>
            {!loading && (
              <View className="mx-4 flex-row justify-between gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  disabled={loading}
                  onPress={() => void handleCancel().catch(console.error)}
                >
                  {t('generic.cancel')}
                </Button>
                {hasAtLeastOne && (
                  <Button
                    variant="cta"
                    size="lg"
                    className="flex-1"
                    disabled={!inputMint}
                    onPress={() => void handleSwapTokens().catch(console.error)}
                  >
                    {swapping ? (
                      <Spinner colorClassName="accent-white" />
                    ) : (
                      t('generic.swap')
                    )}
                  </Button>
                )}
              </View>
            )}
          </SafeArea>
        </View>
      </AnimatedBlurView>
    </>
  )
}

export default memo(() => {
  const { type } = useModal()

  if (type !== 'InsufficientSolConversion') return null
  return <InsufficientSolConversionModal />
})
