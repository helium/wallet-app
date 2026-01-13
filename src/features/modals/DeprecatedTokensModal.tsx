import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
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
import { numberFormat } from '@utils/Balance'
import { useLanguage } from '@utils/i18n'
import { usePollTokenPrices } from '@utils/usePollTokenPrices'
import BN from 'bn.js'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import * as Logger from '../../utils/logger'

const DeprecatedTokensModal: FC = () => {
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

  const { mutateAsync: closePosition } = useClosePosition()

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
      calculateEstimatedHnt()
    }
  }, [isLoadingPositions, hasAnyTokens, calculateEstimatedHnt])

  const handleRemindLater = useCallback(() => {
    hideModal()
    dismissDeprecatedTokens(wallet?.toBase58() || '')
  }, [dismissDeprecatedTokens, wallet, hideModal])

  const handleSwapAll = useCallback(async () => {
    if (!anchorProvider || !wallet) return

    try {
      setProcessing(true)
      setError(undefined)

      // Step 1: Close all positions (both IOT and MOBILE) if any exist
      if (hasStaked) {
        // Close IOT positions
        // eslint-disable-next-line no-restricted-syntax
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
        // eslint-disable-next-line no-restricted-syntax
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

        const iotSwapTxn = await getSwapTx(
          {
            swapRequest: {
              quoteResponse: iotRoute,
              userPublicKey: wallet.toBase58(),
            },
          },
          iotRoute,
        )

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

        const mobileSwapTxn = await getSwapTx(
          {
            swapRequest: {
              quoteResponse: mobileRoute,
              userPublicKey: wallet.toBase58(),
            },
          },
          mobileRoute,
        )

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
        <Box
          position="absolute"
          zIndex={0}
          left={0}
          top={0}
          height="100%"
          width="100%"
          backgroundColor="black"
          pointerEvents={processing ? 'box-none' : 'auto'}
        />
      )}
      <ReAnimatedBlurBox
        entering={FadeInFast}
        position="absolute"
        height="100%"
        width="100%"
        paddingBottom="xl"
        tint="dark"
        intensity={80}
        pointerEvents={processing ? 'box-none' : 'auto'}
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
              {t('deprecatedTokensModal.title')}
            </Text>
          </Box>
          <Box paddingHorizontal="m" paddingVertical="m">
            <Box padding="m" borderRadius="l">
              <Text variant="body3Medium" color="white" opacity={0.6}>
                {t('deprecatedTokensModal.body')}
              </Text>
            </Box>
          </Box>
          <Box flex={1} paddingHorizontal="m" justifyContent="center">
            {isLoadingPositions ? (
              <Box flex={1} justifyContent="center" alignItems="center">
                <CircleLoader loaderSize={30} color="white" />
                <Text
                  variant="body2Medium"
                  color="white"
                  marginTop="m"
                  textAlign="center"
                >
                  {t('deprecatedTokensModal.loadingPositions')}
                </Text>
              </Box>
            ) : (
              <>
                <Box flex={1} justifyContent="center">
                  {hasMobile && (
                    <Box
                      backgroundColor="black600"
                      borderRadius="l"
                      padding="m"
                      marginBottom="s"
                    >
                      <Box flexDirection="row" gap="m" alignItems="center">
                        {mobileJson?.image && (
                          <TokenIcon img={mobileJson.image} size={30} />
                        )}
                        <Box flex={1}>
                          <Text variant="body2Medium" color="white">
                            MOBILE balance
                          </Text>
                        </Box>
                        <Box alignItems="flex-end">
                          <Text variant="body2Bold" color="white">
                            {humanReadable(
                              (mobileBalance || new BN(0)).add(
                                mobileStaked || new BN(0),
                              ),
                              mobileDecimals || 6,
                            )}
                          </Text>
                          {mobileUsdValue && (
                            <Text variant="body3" color="white" opacity={0.7}>
                              ~{mobileUsdValue}
                            </Text>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {hasIot && (
                    <Box
                      backgroundColor="black600"
                      borderRadius="l"
                      padding="m"
                      marginBottom="s"
                    >
                      <Box flexDirection="row" gap="m" alignItems="center">
                        {iotJson?.image && (
                          <TokenIcon img={iotJson.image} size={30} />
                        )}
                        <Box flex={1}>
                          <Text variant="body2Medium" color="white">
                            IOT balance
                          </Text>
                        </Box>
                        <Box alignItems="flex-end">
                          <Text variant="body2Bold" color="white">
                            {humanReadable(
                              (iotBalance || new BN(0)).add(
                                iotStaked || new BN(0),
                              ),
                              iotDecimals || 6,
                            )}
                          </Text>
                          {iotUsdValue && (
                            <Text variant="body3" color="white" opacity={0.7}>
                              ~{iotUsdValue}
                            </Text>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Estimated HNT Preview */}
                  <Box marginTop="m">
                    {!loadingEstimate && estimatedHnt > 0 && (
                      <Box
                        borderRadius="l"
                        padding="m"
                        backgroundColor="black600"
                      >
                        <Text
                          variant="body2Medium"
                          color="white"
                          textAlign="center"
                          marginBottom="xs"
                        >
                          {t('deprecatedTokensModal.estimatedReceive')}
                        </Text>
                        <Text
                          variant="h3"
                          color="greenBright500"
                          textAlign="center"
                        >
                          ~{estimatedHnt.toFixed(4)} HNT
                        </Text>
                        {estimatedUsdValue && (
                          <Text
                            variant="body2"
                            color="white"
                            opacity={0.7}
                            textAlign="center"
                            marginTop="xs"
                          >
                            ~{estimatedUsdValue}
                          </Text>
                        )}
                      </Box>
                    )}

                    {loadingEstimate && (
                      <Box alignItems="center">
                        <CircleLoader loaderSize={20} color="white" />
                        <Text
                          variant="body3"
                          color="white"
                          opacity={0.7}
                          marginTop="xs"
                        >
                          {t('deprecatedTokensModal.calculatingEstimate')}
                        </Text>
                      </Box>
                    )}

                    {error && (
                      <Box>
                        <Text
                          variant="body3Medium"
                          color="red500"
                          textAlign="center"
                        >
                          {error}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>

                {processing && (
                  <Box alignItems="center">
                    <CircleLoader loaderSize={30} color="white" />
                    <Text
                      variant="body2Medium"
                      color="white"
                      marginTop="m"
                      textAlign="center"
                    >
                      {t('deprecatedTokensModal.processing')}
                    </Text>
                  </Box>
                )}
              </>
            )}
          </Box>

          {!processing && !isLoadingPositions && (
            <Box paddingHorizontal="m">
              <ButtonPressable
                width="100%"
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                titleColorPressedOpacity={0.3}
                titleColor="black"
                title={
                  hasStaked
                    ? t('deprecatedTokensModal.unstakeAndSwap')
                    : t('deprecatedTokensModal.swapNow')
                }
                onPress={handleSwapAll}
                marginBottom="m"
                disabled={!hasAnyTokens}
              />

              <ButtonPressable
                width="100%"
                borderRadius="round"
                backgroundColor="black400"
                backgroundColorOpacityPressed={0.05}
                titleColorPressedOpacity={0.3}
                titleColor="white"
                title={t('deprecatedTokensModal.remindLater')}
                onPress={handleRemindLater}
                marginBottom="m"
              />
            </Box>
          )}
        </SafeAreaBox>
      </ReAnimatedBlurBox>
    </>
  )
}

export default memo(() => {
  const { type } = useModal()

  if (type !== 'DeprecatedTokens') return null
  return <DeprecatedTokensModal />
})
