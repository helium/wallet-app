import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import Text from '@components/Text'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import {
  HELIUM_COMMON_LUT,
  HELIUM_COMMON_LUT_DEVNET,
  HNT_MINT,
  Status,
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  humanReadable,
  sendAndConfirmWithRetry,
  toBN,
  toNumber,
  toVersionedTx,
} from '@helium/spl-utils'
import {
  calcLockupMultiplier,
  useClaimAllPositionsRewards,
  useCreatePosition,
} from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { RouteProp, useRoute } from '@react-navigation/native'
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import globalStyles from '@theme/globalStyles'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import { daysToSecs, getFormattedStringFromDays } from '@utils/dateTools'
import { getBasePriorityFee } from '@utils/walletApiV2'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { MessagePreview } from '../../solana/MessagePreview'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { ClaimingRewardsModal } from './ClaimingRewardsModal'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceStackParamList } from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'VotingPowerScreen'>

export const VotingPowerScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const wallet = useCurrentWallet()
  const { walletSignBottomSheetRef } = useWalletSign()
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [statusOfClaim, setStatusOfClaim] = useState<Status | undefined>()
  const {
    mint,
    registrar,
    loading,
    refetch: refetchState,
    positions,
    setMint,
  } = useGovernance()
  const { symbol } = useMetaplexMetadata(mint)
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const { error: createPositionError, createPosition } = useCreatePosition()
  const {
    error: claimingAllRewardsError,
    loading: claimingAllRewards,
    claimAllPositionsRewards,
  } = useClaimAllPositionsRewards()
  const { cluster } = useSolana()

  useEffect(() => {
    if (mint && route.params.mint) {
      const routeMint = new PublicKey(route.params.mint)

      if (!mint.equals(routeMint)) {
        setMint(routeMint)
      }
    }
  }, [mint, route, setMint])

  const positionsWithRewards = useMemo(
    () => positions?.filter((p) => p.hasRewards),
    [positions],
  )

  const transactionError = useMemo(() => {
    if (createPositionError) {
      return createPositionError.message || t('gov.errors.lockTokens')
    }

    if (claimingAllRewardsError) {
      return claimingAllRewardsError.message || t('gov.errors.claimRewards')
    }

    return undefined
  }, [createPositionError, claimingAllRewardsError, t])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const maxLockupAmount =
    ownedAmount && decimals
      ? toNumber(new BN(ownedAmount.toString()), decimals)
      : 0

  const handleCalcLockupMultiplier = useCallback(
    (lockupPeriodInDays: number) =>
      (registrar &&
        calcLockupMultiplier({
          lockupSecs: daysToSecs(lockupPeriodInDays),
          registrar,
          mint,
        })) ||
      0,
    [mint, registrar],
  )

  const { anchorProvider } = useSolana()

  const decideAndExecute = async ({
    header,
    message,
    instructions,
    sigs = [],
    onProgress = () => {},
    sequentially = false,
  }: {
    header: string
    message: string
    instructions: TransactionInstruction[]
    sigs?: Keypair[]
    onProgress?: (status: Status) => void
    sequentially?: boolean
  }) => {
    if (!anchorProvider || !walletSignBottomSheetRef) return

    const transactions = await batchInstructionsToTxsWithPriorityFee(
      anchorProvider,
      instructions,
      {
        basePriorityFee: await getBasePriorityFee(),
        addressLookupTableAddresses: [
          cluster === 'devnet' ? HELIUM_COMMON_LUT_DEVNET : HELIUM_COMMON_LUT,
        ],
        extraSigners: sigs,
      },
    )

    const asVersionedTx = transactions.map(toVersionedTx)

    const decision = await walletSignBottomSheetRef.show({
      type: WalletStandardMessageTypes.signTransaction,
      url: '',
      header,
      serializedTxs: asVersionedTx.map((transaction) =>
        Buffer.from(transaction.serialize()),
      ),
      suppressWarnings: sequentially,
      renderer: () => <MessagePreview message={message} />,
    })

    if (decision) {
      if (transactions.length > 1 && sequentially) {
        let i = 0
        // eslint-disable-next-line no-restricted-syntax
        for (const tx of await anchorProvider.wallet.signAllTransactions(
          asVersionedTx,
        )) {
          const draft = transactions[i]
          sigs.forEach((sig) => {
            if (draft.signers?.some((s) => s.publicKey.equals(sig.publicKey))) {
              tx.sign([sig])
            }
          })

          await sendAndConfirmWithRetry(
            anchorProvider.connection,
            Buffer.from(tx.serialize()),
            {
              skipPreflight: true,
            },
            'confirmed',
          )
          // eslint-disable-next-line no-plusplus
          i++
        }
      } else {
        await bulkSendTransactions(
          anchorProvider,
          transactions,
          onProgress,
          undefined,
          sigs,
          MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
        )
      }
    } else {
      throw new Error('User rejected transaction')
    }
  }

  const handleLockTokens = async (values: LockTokensModalFormValues) => {
    const { amount, lockupPeriodInDays, lockupKind, subDao } = values
    if (decimals && walletSignBottomSheetRef && symbol) {
      const amountToLock = toBN(amount, decimals)

      await createPosition({
        amount: amountToLock,
        lockupPeriodsInDays: lockupPeriodInDays,
        lockupKind: lockupKind.value,
        mint,
        subDao,
        onInstructions: (ixs, sigs) =>
          decideAndExecute({
            header: t('gov.transactions.lockTokens'),
            message: `Are you sure you want to lock ${humanReadable(
              amountToLock,
              decimals,
            )} ${symbol} for ${getFormattedStringFromDays(
              lockupPeriodInDays,
            )}?`,
            instructions: ixs,
            sigs,
            sequentially: !!subDao,
          }),
      })

      refetchState()
    }
  }

  const handleClaimRewards = async () => {
    if (positionsWithRewards && walletSignBottomSheetRef) {
      await claimAllPositionsRewards({
        positions: positionsWithRewards,
        onInstructions: (ixs) =>
          decideAndExecute({
            header: t('gov.transactions.claimRewards'),
            message: 'Approve this transaction to claim your rewards',
            instructions: ixs,
            onProgress: setStatusOfClaim,
          }),
      })

      if (!claimingAllRewardsError) {
        refetchState()
      }
    }
  }

  return (
    <>
      <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
        <BackScreen
          headerTopMargin="l"
          padding="none"
          title={t('gov.votingPower.yourPower')}
          edges={backEdges}
        >
          <ScrollView>
            <Box flex={1} paddingHorizontal="m">
              <VotingPowerCard marginTop="l" />
              <PositionsList positions={positions} />
            </Box>
          </ScrollView>
          {showError && (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              paddingTop="ms"
            >
              <Text variant="body3Medium" color="red500">
                {showError}
              </Text>
            </Box>
          )}
          <Box flexDirection="row" padding="m">
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="round"
              borderWidth={2}
              borderColor="white"
              backgroundColorOpacityPressed={0.7}
              title={t('gov.transactions.lockTokens')}
              titleColor="white"
              titleColorPressed="black"
              onPress={() => setIsLockModalOpen(true)}
              disabled={claimingAllRewards || loading}
            />
            {HNT_MINT.equals(mint) && (
              <>
                <Box paddingHorizontal="s" />
                <ButtonPressable
                  flex={1}
                  fontSize={16}
                  borderRadius="round"
                  borderWidth={2}
                  borderColor={
                    // eslint-disable-next-line no-nested-ternary
                    claimingAllRewards
                      ? 'surfaceSecondary'
                      : !positionsWithRewards?.length
                      ? 'surfaceSecondary'
                      : 'white'
                  }
                  backgroundColor="white"
                  backgroundColorOpacityPressed={0.7}
                  backgroundColorDisabled="surfaceSecondary"
                  backgroundColorDisabledOpacity={0.9}
                  titleColorDisabled="secondaryText"
                  title={
                    claimingAllRewards ? '' : t('gov.transactions.claimRewards')
                  }
                  titleColor="black"
                  onPress={handleClaimRewards}
                  disabled={
                    !positionsWithRewards?.length ||
                    claimingAllRewards ||
                    loading
                  }
                />
              </>
            )}
          </Box>
        </BackScreen>
      </ReAnimatedBox>
      {claimingAllRewards && <ClaimingRewardsModal status={statusOfClaim} />}
      {isLockModalOpen && (
        <LockTokensModal
          mint={mint}
          maxLockupAmount={maxLockupAmount}
          calcMultiplierFn={handleCalcLockupMultiplier}
          onClose={() => setIsLockModalOpen(false)}
          onSubmit={handleLockTokens}
        />
      )}
    </>
  )
}

export default VotingPowerScreen
