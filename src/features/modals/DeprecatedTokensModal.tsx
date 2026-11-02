import {
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  humanReadable,
  toNumber,
} from '@helium/spl-utils'
import {
  PositionWithMeta,
  useClosePosition,
} from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useSubmitInstructions } from '@hooks/useSubmitInstructions'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useDeprecatedTokens } from '@storage/DeprecatedTokensProvider'
import { useJupiter } from '@storage/JupiterProvider'
import { useModal } from '@storage/ModalsProvider'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { numberFormat } from '@utils/Balance'
import { useLanguage } from '@utils/i18n'
import { usePollTokenPrices } from '@utils/usePollTokenPrices'
import BN from 'bn.js'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BlurView } from 'expo-blur'
import { Platform, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import * as Logger from '../../utils/logger'
import { FADE_IN } from '@theme/motion'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)
const SafeArea = withUniwind(SafeAreaView)

const DeprecatedTokensModal: FC = () => {
  // Opt out: compiler cannot lower try/finally or throw inside try/catch, see calculateEstimatedHnt and handleSwapAll
  'use no memo'

  const { t } = useTranslation()
  const { anchorProvider } = useSolana()
  const { hideModal } = useModal()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const wallet = useCurrentWallet()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>()
  const [estimatedHnt, setEstimatedHnt] = useState<number>(0)
  const [loadingEstimate, setLoadingEstimate] = useState(false)
  const { dismissDeprecatedTokens, currency: currencyRaw } = useAppStorage()
  const { submitJupiterSwap } = useSubmitTxn()
  const { getRoute, getSwapTx } = useJupiter()
  const { execute: submitInstructions } = useSubmitInstructions()
  const { tokenPrices } = usePollTokenPrices()
  const { language } = useLanguage()
  const { json: iotJson } = useMetaplexMetadata(IOT_MINT)
  const { json: mobileJson } = useMetaplexMetadata(MOBILE_MINT)

  const currency = useMemo(() => currencyRaw?.toLowerCase(), [currencyRaw])

  // Use shared deprecated tokens data
  const {
    iotBalance,
    iotDecimals,
    iotStaked,
    iotPositions,
    mobileBalance,
    mobileDecimals,
    mobileStaked,
    mobilePositions,
    hasIot,
    hasMobile,
    hasStakedIot,
    hasStakedMobile,
    hasStaked,
    hasAnyTokens,
    isLoadingPositions,
  } = useDeprecatedTokens()

  const estimatedUsdValue = useMemo(() => {
    if (!estimatedHnt || !tokenPrices?.helium?.[currency]) return null
    const hntPrice = tokenPrices.helium[currency]
    const value = hntPrice * estimatedHnt
    return numberFormat(language, currency, value)
  }, [estimatedHnt, tokenPrices, currency, language])

  const iotUsdValue = useMemo(() => {
    if (!hasIot || !tokenPrices?.['helium-iot']?.[currency]) return null
    const iotPrice = tokenPrices['helium-iot'][currency]
    const totalIot = toNumber(
      (iotBalance || new BN(0)).add(iotStaked || new BN(0)),
      iotDecimals || 6,
    )
    const value = iotPrice * totalIot
    return numberFormat(language, currency, value)
  }, [
    hasIot,
    tokenPrices,
    currency,
    iotBalance,
    iotStaked,
    iotDecimals,
    language,
  ])

  const mobileUsdValue = useMemo(() => {
    if (!hasMobile || !tokenPrices?.['helium-mobile']?.[currency]) return null
    const mobilePrice = tokenPrices['helium-mobile'][currency]
    const totalMobile = toNumber(
      (mobileBalance || new BN(0)).add(mobileStaked || new BN(0)),
      mobileDecimals || 6,
    )
    const value = mobilePrice * totalMobile
    return numberFormat(language, currency, value)
  }, [
    hasMobile,
    tokenPrices,
    currency,
    mobileBalance,
    mobileStaked,
    mobileDecimals,
    language,
  ])

  const { closePosition } = useClosePosition()

  // Calculate estimated HNT from swaps
  const calculateEstimatedHnt = useCallback(async () => {
    if (!hasAnyTokens || isLoadingPositions) return

    setLoadingEstimate(true)
    let totalHnt = 0

    try {
      // Calculate IOT -> HNT
      if (hasIot || hasStakedIot) {
        const totalIot = (iotBalance || new BN(0)).add(iotStaked || new BN(0))
        if (totalIot.gt(new BN(0))) {
          const iotRoute = await getRoute({
            amount: totalIot.toNumber(),
            inputMint: IOT_MINT.toBase58(),
            outputMint: HNT_MINT.toBase58(),
            slippageBps: 50,
          })

          if (iotRoute?.outAmount) {
            totalHnt += toNumber(new BN(Number(iotRoute.outAmount)), 8)
          }
        }
      }

      // Calculate MOBILE -> HNT
      if (hasMobile || hasStakedMobile) {
        const totalMobile = (mobileBalance || new BN(0)).add(
          mobileStaked || new BN(0),
        )
        if (totalMobile.gt(new BN(0))) {
          const mobileRoute = await getRoute({
            amount: totalMobile.toNumber(),
            inputMint: MOBILE_MINT.toBase58(),
            outputMint: HNT_MINT.toBase58(),
            slippageBps: 50,
          })

          if (mobileRoute?.outAmount) {
            totalHnt += toNumber(new BN(Number(mobileRoute.outAmount)), 8)
          }
        }
      }

      setEstimatedHnt(totalHnt)
    } catch (err) {
      Logger.error(err)
    } finally {
      setLoadingEstimate(false)
    }
  }, [
    hasAnyTokens,
    isLoadingPositions,
    hasIot,
    hasStakedIot,
    hasMobile,
    hasStakedMobile,
    iotBalance,
    iotStaked,
    mobileBalance,
    mobileStaked,
    getRoute,
  ])

  // Load estimate when modal opens and data is ready
  React.useEffect(() => {
    if (!isLoadingPositions && hasAnyTokens) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the estimate shows its loader (setLoadingEstimate(true)) before the swap-route fetch; the component is not compiled anyway (try/finally, throw in try/catch)
      void calculateEstimatedHnt()
    }
  }, [isLoadingPositions, hasAnyTokens, calculateEstimatedHnt])

  const handleRemindLater = useCallback(() => {
    hideModal()
    void dismissDeprecatedTokens(wallet?.toBase58() || '')
  }, [dismissDeprecatedTokens, wallet, hideModal])

  const handleSwapAll = useCallback(async () => {
    if (!anchorProvider || !wallet) return

    try {
      setProcessing(true)
      setError(undefined)

      // Step 1: Close all positions (both IOT and MOBILE) if any exist
      if (hasStaked) {
        // Close IOT positions
        for (const position of iotPositions || []) {
          await closePosition({
            position: {
              ...position.info,
              votingMint: {
                mint: IOT_MINT,
              },
            } as PositionWithMeta,
            onInstructions: async (ixs) => {
              await submitInstructions({
                header: t('deprecatedTokensModal.unstaking'),
                message: t('deprecatedTokensModal.closingPositions'),
                instructions: ixs,
              })
            },
          })
        }

        // Close MOBILE positions
        for (const position of mobilePositions || []) {
          await closePosition({
            position: {
              ...position.info,
              votingMint: {
                mint: MOBILE_MINT,
              },
            } as PositionWithMeta,
            onInstructions: async (ixs) => {
              await submitInstructions({
                header: t('deprecatedTokensModal.unstaking'),
                message: t('deprecatedTokensModal.closingPositions'),
                instructions: ixs,
              })
            },
          })
        }

        // Wait for balances to update on-chain
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      // Step 2: Get updated balances after unstaking
      const { connection } = anchorProvider

      // Fetch IOT balance
      let finalIotAmount = new BN(0)
      if (hasIot || hasStakedIot) {
        const iotAccounts = await connection.getTokenAccountsByOwner(wallet, {
          mint: IOT_MINT,
        })
        if (iotAccounts.value[0]?.pubkey) {
          const iotTokenAccount = await connection.getTokenAccountBalance(
            iotAccounts.value[0].pubkey,
          )
          finalIotAmount = new BN(iotTokenAccount?.value?.amount || '0')
        }
      }

      // Fetch MOBILE balance
      let finalMobileAmount = new BN(0)
      if (hasMobile || hasStakedMobile) {
        const mobileAccounts = await connection.getTokenAccountsByOwner(
          wallet,
          {
            mint: MOBILE_MINT,
          },
        )
        if (mobileAccounts.value[0]?.pubkey) {
          const mobileTokenAccount = await connection.getTokenAccountBalance(
            mobileAccounts.value[0].pubkey,
          )
          finalMobileAmount = new BN(mobileTokenAccount?.value?.amount || '0')
        }
      }

      // Step 3: Swap IOT to HNT if we have any
      if (finalIotAmount.gt(new BN(0))) {
        const inputAmount = toNumber(finalIotAmount, iotDecimals || 6)

        const iotRoute = await getRoute({
          amount: finalIotAmount.toNumber(),
          inputMint: IOT_MINT.toBase58(),
          outputMint: HNT_MINT.toBase58(),
          slippageBps: 50,
        })

        if (!iotRoute) {
          throw new Error('No swap route found for IOT')
        }

        const outputAmount = toNumber(
          new BN(Number(iotRoute?.outAmount || 0)),
          8, // HNT decimals
        )

        const minReceived = outputAmount - outputAmount * (50 / 100 / 100)

        const iotSwapTxn = await getSwapTx(iotRoute)

        if (!iotSwapTxn) {
          throw new Error('Failed to generate swap transaction for IOT')
        }

        try {
          await submitJupiterSwap({
            inputMint: IOT_MINT,
            inputAmount,
            outputMint: HNT_MINT,
            outputAmount,
            minReceived,
            swapTxn: iotSwapTxn,
          })
        } catch (err) {
          throw new Error(`Failed to swap IOT: ${(err as Error).message}`)
        }

        // Wait for transaction to be confirmed
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      // Step 4: Swap MOBILE to HNT if we have any
      if (finalMobileAmount.gt(new BN(0))) {
        const inputAmount = toNumber(finalMobileAmount, mobileDecimals || 6)

        const mobileRoute = await getRoute({
          amount: finalMobileAmount.toNumber(),
          inputMint: MOBILE_MINT.toBase58(),
          outputMint: HNT_MINT.toBase58(),
          slippageBps: 50,
        })

        if (!mobileRoute) {
          throw new Error('No swap route found for MOBILE')
        }

        const outputAmount = toNumber(
          new BN(Number(mobileRoute?.outAmount || 0)),
          8, // HNT decimals
        )

        const minReceived = outputAmount - outputAmount * (50 / 100 / 100)

        const mobileSwapTxn = await getSwapTx(mobileRoute)

        if (!mobileSwapTxn) {
          throw new Error('Failed to generate swap transaction for MOBILE')
        }

        try {
          await submitJupiterSwap({
            inputMint: MOBILE_MINT,
            inputAmount,
            outputMint: HNT_MINT,
            outputAmount,
            minReceived,
            swapTxn: mobileSwapTxn,
          })
        } catch (err) {
          throw new Error(`Failed to swap MOBILE: ${(err as Error).message}`)
        }

        // Wait for transaction to be confirmed
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      // Only hide modal and stop processing if everything succeeded
      setProcessing(false)
      hideModal()
    } catch (err) {
      Logger.error(err)
      setError((err as Error).message)
      setProcessing(false)
    }
  }, [
    anchorProvider,
    wallet,
    hasStaked,
    hasIot,
    hasMobile,
    hasStakedIot,
    hasStakedMobile,
    iotPositions,
    mobilePositions,
    iotDecimals,
    mobileDecimals,
    closePosition,
    submitInstructions,
    getRoute,
    getSwapTx,
    submitJupiterSwap,
    hideModal,
    t,
  ])

  return (
    <>
      {Platform.OS === 'android' && (
        <View
          className="absolute inset-0 z-0 bg-background"
          pointerEvents={processing ? 'box-none' : 'auto'}
        />
      )}
      <AnimatedBlurView
        entering={FADE_IN}
        style={StyleSheet.absoluteFill}
        tint="light"
        intensity={80}
        pointerEvents={processing ? 'box-none' : 'auto'}
      >
        <View className="flex-1 pb-8">
          <SafeArea edges={edges} className="flex-1">
            <View className="flex-row items-center justify-center px-4 pt-2">
              <Text size="xl" className="flex-1 text-center">
                {t('deprecatedTokensModal.title')}
              </Text>
            </View>
            <View className="p-4">
              <View className="rounded-[12px] p-4">
                <Text size="xs" className="font-medium text-muted-foreground">
                  {t('deprecatedTokensModal.body')}
                </Text>
              </View>
            </View>
            <View className="flex-1 justify-center px-4">
              {isLoadingPositions ? (
                <View className="flex-1 items-center justify-center">
                  <Spinner size="large" />
                  <Text className="mt-4 text-center font-medium">
                    {t('deprecatedTokensModal.loadingPositions')}
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-1 justify-center">
                    {hasMobile && (
                      <View className="mb-2 rounded-[12px] bg-secondary p-4">
                        <View className="flex-row items-center gap-4">
                          {mobileJson?.image && (
                            <TokenIcon img={mobileJson.image} size={30} />
                          )}
                          <View className="flex-1">
                            <Text className="font-medium">MOBILE balance</Text>
                          </View>
                          <View className="items-end">
                            <Text className="font-bold">
                              {humanReadable(
                                (mobileBalance || new BN(0)).add(
                                  mobileStaked || new BN(0),
                                ),
                                mobileDecimals || 6,
                              )}
                            </Text>
                            {mobileUsdValue && (
                              <Text size="xs" className="text-muted-foreground">
                                ~{mobileUsdValue}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    )}

                    {hasIot && (
                      <View className="mb-2 rounded-[12px] bg-secondary p-4">
                        <View className="flex-row items-center gap-4">
                          {iotJson?.image && (
                            <TokenIcon img={iotJson.image} size={30} />
                          )}
                          <View className="flex-1">
                            <Text className="font-medium">IOT balance</Text>
                          </View>
                          <View className="items-end">
                            <Text className="font-bold">
                              {humanReadable(
                                (iotBalance || new BN(0)).add(
                                  iotStaked || new BN(0),
                                ),
                                iotDecimals || 6,
                              )}
                            </Text>
                            {iotUsdValue && (
                              <Text size="xs" className="text-muted-foreground">
                                ~{iotUsdValue}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Estimated HNT Preview */}
                    <View className="mt-4">
                      {!loadingEstimate && estimatedHnt > 0 && (
                        <View className="rounded-[12px] bg-secondary p-4">
                          <Text className="mb-1 text-center font-medium">
                            {t('deprecatedTokensModal.estimatedReceive')}
                          </Text>
                          <Text
                            size="2xl"
                            className="text-center text-success-500"
                          >
                            ~{estimatedHnt.toFixed(4)} HNT
                          </Text>
                          {estimatedUsdValue && (
                            <Text className="mt-1 text-center text-muted-foreground">
                              ~{estimatedUsdValue}
                            </Text>
                          )}
                        </View>
                      )}

                      {loadingEstimate && (
                        <View className="items-center">
                          <Spinner />
                          <Text
                            size="xs"
                            className="mt-1 text-muted-foreground"
                          >
                            {t('deprecatedTokensModal.calculatingEstimate')}
                          </Text>
                        </View>
                      )}

                      {error && (
                        <View>
                          <Text
                            size="xs"
                            className="text-center font-medium text-destructive"
                          >
                            {error}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {processing && (
                    <View className="items-center">
                      <Spinner size="large" />
                      <Text className="mt-4 text-center font-medium">
                        {t('deprecatedTokensModal.processing')}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {!processing && !isLoadingPositions && (
              <View className="px-4">
                <Button
                  variant="cta"
                  size="dashboard"
                  className="mb-4 w-full"
                  onPress={() => void handleSwapAll().catch(console.error)}
                  disabled={!hasAnyTokens}
                >
                  {hasStaked
                    ? t('deprecatedTokensModal.unstakeAndSwap')
                    : t('deprecatedTokensModal.swapNow')}
                </Button>

                <Button
                  variant="secondary"
                  size="dashboard"
                  className="mb-4 w-full"
                  onPress={handleRemindLater}
                >
                  {t('deprecatedTokensModal.remindLater')}
                </Button>
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

  if (type !== 'DeprecatedTokens') return null
  return <DeprecatedTokensModal />
})
