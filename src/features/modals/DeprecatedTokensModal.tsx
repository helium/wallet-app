import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import {
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  humanReadable,
  populateMissingDraftInfo,
  toNumber,
  toVersionedTx,
} from '@helium/spl-utils'
import {
  PositionWithMeta,
  useClosePosition,
} from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { TransactionInstruction } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useDeprecatedTokens } from '@storage/DeprecatedTokensProvider'
import { useJupiter } from '@storage/JupiterProvider'
import { useModal } from '@storage/ModalsProvider'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import { getBasePriorityFee } from '@utils/walletApiV2'
import BN from 'bn.js'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import * as Logger from '../../utils/logger'

const DeprecatedTokensModal: FC = () => {
  const { t } = useTranslation()
  const { anchorProvider } = useSolana()
  const { hideModal } = useModal()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const wallet = useCurrentWallet()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>()
  const { dismissDeprecatedTokens } = useAppStorage()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { submitJupiterSwap } = useSubmitTxn()
  const { getRoute, getSwapTx } = useJupiter()

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

  const { closePosition } = useClosePosition()

  const handleDismiss = useCallback(async () => {
    if (wallet) {
      await dismissDeprecatedTokens(wallet.toBase58())
    }
    hideModal()
  }, [dismissDeprecatedTokens, hideModal, wallet])

  const handleRemindLater = useCallback(() => {
    hideModal()
  }, [hideModal])

  const decideAndExecute = useCallback(
    async (instructions: TransactionInstruction[]) => {
      if (!anchorProvider || !walletSignBottomSheetRef) return

      const transactions = await batchInstructionsToTxsWithPriorityFee(
        anchorProvider,
        instructions,
        {
          basePriorityFee: await getBasePriorityFee(),
          useFirstEstimateForAll: true,
          computeScaleUp: 1.4,
        },
      )
      const populatedTxs = await Promise.all(
        transactions.map((tx) =>
          populateMissingDraftInfo(anchorProvider.connection, tx),
        ),
      )
      const txs = populatedTxs.map((tx) => toVersionedTx(tx))

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('deprecatedTokensModal.unstaking'),
        serializedTxs: txs.map((transaction) =>
          Buffer.from(transaction.serialize()),
        ),
        renderer: () => (
          <Box
            backgroundColor="surface"
            borderRadius="l"
            mt="m"
            px="m"
            py="ms"
            gap="s"
          >
            <Text variant="body2Medium" color="white">
              {t('deprecatedTokensModal.closingPositions')}
            </Text>
            {hasStakedIot && (
              <Box flexDirection="row" justifyContent="space-between">
                <Text variant="body2" color="white" opacity={0.7}>
                  IOT
                </Text>
                <Text variant="body2" color="orange500">
                  {humanReadable(iotStaked || new BN(0), iotDecimals || 6)}
                </Text>
              </Box>
            )}
            {hasStakedMobile && (
              <Box flexDirection="row" justifyContent="space-between">
                <Text variant="body2" color="white" opacity={0.7}>
                  MOBILE
                </Text>
                <Text variant="body2" color="orange500">
                  {humanReadable(
                    mobileStaked || new BN(0),
                    mobileDecimals || 6,
                  )}
                </Text>
              </Box>
            )}
          </Box>
        ),
      })

      if (decision) {
        await bulkSendTransactions(
          anchorProvider,
          transactions,
          undefined,
          10,
          [],
          MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
        )
      } else {
        throw new Error('User rejected transaction')
      }
    },
    [
      anchorProvider,
      walletSignBottomSheetRef,
      t,
      hasStakedIot,
      hasStakedMobile,
      iotStaked,
      iotDecimals,
      mobileStaked,
      mobileDecimals,
    ],
  )

  const handleSwapAll = useCallback(async () => {
    if (!anchorProvider || !walletSignBottomSheetRef || !wallet) return

    try {
      setProcessing(true)
      setError(undefined)

      // Step 1: Close all positions (both IOT and MOBILE) if any exist
      if (hasStaked) {
        const allInstructions: TransactionInstruction[] = []

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
              allInstructions.push(...ixs)
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
              allInstructions.push(...ixs)
            },
          })
        }

        if (allInstructions.length > 0) {
          await decideAndExecute(allInstructions)
          // Wait for balances to update on-chain
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
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
    walletSignBottomSheetRef,
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
    decideAndExecute,
    getRoute,
    getSwapTx,
    submitJupiterSwap,
    hideModal,
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
          <Box flex={1} paddingHorizontal="m" justifyContent="space-between">
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
                <Box>
                  <Text
                    variant="body1Medium"
                    color="white"
                    opacity={0.6}
                    textAlign="center"
                    marginTop="l"
                  >
                    {t('deprecatedTokensModal.body')}
                  </Text>

                  <Box marginTop="xl">
                    {hasIot && (
                      <Box
                        backgroundColor="surfaceSecondary"
                        borderRadius="l"
                        padding="m"
                        marginBottom="m"
                      >
                        <Text variant="body2Medium" color="white">
                          IOT{' '}
                          <Text variant="body2" color="white" opacity={0.7}>
                            {humanReadable(
                              new BN(iotBalance?.toString() || '0'),
                              iotDecimals || 6,
                            )}
                          </Text>
                          {hasStakedIot && (
                            <Text variant="body2" color="orange500">
                              {' '}
                              Staked:{' '}
                              {humanReadable(
                                iotStaked || new BN(0),
                                iotDecimals || 6,
                              )}
                            </Text>
                          )}
                        </Text>
                      </Box>
                    )}

                    {hasMobile && (
                      <Box
                        backgroundColor="surfaceSecondary"
                        borderRadius="l"
                        padding="m"
                        marginBottom="m"
                      >
                        <Text variant="body2Medium" color="white">
                          MOBILE{' '}
                          <Text variant="body2" color="white" opacity={0.7}>
                            {humanReadable(
                              new BN(mobileBalance?.toString() || '0'),
                              mobileDecimals || 6,
                            )}
                          </Text>
                          {hasStakedMobile && (
                            <Text variant="body2" color="orange500">
                              {' '}
                              Staked:{' '}
                              {humanReadable(
                                mobileStaked || new BN(0),
                                mobileDecimals || 6,
                              )}
                            </Text>
                          )}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {error && (
                    <Box marginTop="m">
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

                {processing && (
                  <Box alignItems="center" marginBottom="xl">
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

              <ButtonPressable
                width="100%"
                borderRadius="round"
                backgroundColor="matchaRed500"
                backgroundColorOpacityPressed={0.05}
                titleColorPressedOpacity={0.3}
                titleColor="white"
                title={t('deprecatedTokensModal.dismiss')}
                onPress={handleDismiss}
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
