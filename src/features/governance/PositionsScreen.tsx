import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Dot from '@components/Dot'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import { useOwnedAmount, useSolanaUnixNow } from '@helium/helium-react-hooks'
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
  SubDaoWithMeta,
  calcLockupMultiplier,
  useClaimAllPositionsRewards,
  useCreatePosition,
  useDelegatePositions,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useNavigation } from '@react-navigation/native'
import { Keypair, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import {
  IOT_SUB_DAO_KEY,
  MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
  MOBILE_SUB_DAO_KEY,
} from '@utils/constants'
import { daysToSecs, getFormattedStringFromDays } from '@utils/dateTools'
import { getBasePriorityFee } from '@utils/walletApiV2'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessagePreview } from '../../solana/MessagePreview'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { ClaimingRewardsModal } from './ClaimingRewardsModal'
import { DelegateTokensModal } from './DelegateTokensModal'
import GovernanceWrapper from './GovernanceWrapper'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceNavigationProp } from './governanceTypes'

export const PositionsScreen = () => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const { walletSignBottomSheetRef } = useWalletSign()
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [statusOfClaim, setStatusOfClaim] = useState<Status | undefined>()
  const {
    mint,
    registrar,
    loading,
    refetch: refetchState,
    positions,
  } = useGovernance()
  const { symbol } = useMetaplexMetadata(mint)
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const {
    error: createPositionError,
    createPosition,
    rentFee: solFees,
    prepaidTxFees,
    insufficientBalance,
  } = useCreatePosition({
    automationEnabled,
  })
  const {
    error: claimingAllRewardsError,
    loading: claimingAllRewards,
    claimAllPositionsRewards,
  } = useClaimAllPositionsRewards()
  const { cluster } = useSolana()

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
    computeScaleUp,
    maxInstructionsPerTx,
  }: {
    header: string
    message: string
    instructions: TransactionInstruction[] | TransactionInstruction[][]
    sigs?: Keypair[]
    onProgress?: (status: Status) => void
    sequentially?: boolean
    computeScaleUp?: number
    maxInstructionsPerTx?: number
  }) => {
    if (!anchorProvider || !walletSignBottomSheetRef) return

    const transactions = await batchInstructionsToTxsWithPriorityFee(
      anchorProvider,
      instructions,
      {
        computeScaleUp,
        maxInstructionsPerTx,
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
              skipPreflight: false,
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
            message: t('gov.votingPower.lockYourTokens', {
              amount: humanReadable(amountToLock, decimals),
              symbol,
              duration: getFormattedStringFromDays(lockupPeriodInDays),
            }),
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
            computeScaleUp: 1.4,
            maxInstructionsPerTx: 8,
          }),
      })

      if (!claimingAllRewardsError) {
        refetchState()
      }
    }
  }

  const [isDelegateAllModalOpen, setIsDelegateAllModalOpen] = useState(false)
  const [delegateAllSubDao, setDelegateAllSubDao] =
    useState<SubDaoWithMeta | null>(null)
  const [delegateAllAutomationEnabled, setDelegateAllAutomationEnabled] =
    useState(true)

  const now = useSolanaUnixNow()
  const { result: subDaos } = useSubDaos()
  const delegatedPositions = useMemo(() => {
    return positions?.filter((p) => p.isDelegated && p.delegatedSubDao)
  }, [positions])
  const unexpiredPositions = useMemo(
    () =>
      positions?.filter(
        (p) =>
          (p.lockup.kind.constant ||
            p.lockup.endTs.gt(new BN(now?.toString() || '0'))) &&
          !p.isProxiedToMe,
      ),
    [positions, now],
  )

  useEffect(() => {
    if (!subDaos || !delegatedPositions || delegateAllSubDao) return
    const mobileSubDao = subDaos.find((sd) =>
      sd.pubkey.equals(MOBILE_SUB_DAO_KEY),
    )
    const iotSubDao = subDaos.find((sd) => sd.pubkey.equals(IOT_SUB_DAO_KEY))
    if (!mobileSubDao) return

    let mobileDelegations = 0
    let iotDelegations = 0
    let totalDelegated = 0

    delegatedPositions?.forEach((position) => {
      if (position.isDelegated && position.delegatedSubDao) {
        totalDelegated += 1
        if (position.delegatedSubDao.equals(MOBILE_SUB_DAO_KEY)) {
          mobileDelegations += 1
        } else if (position.delegatedSubDao.equals(IOT_SUB_DAO_KEY)) {
          iotDelegations += 1
        }
      }
    })

    if (totalDelegated === 0) {
      setDelegateAllSubDao(mobileSubDao)
    } else if (mobileDelegations === totalDelegated) {
      setDelegateAllSubDao(mobileSubDao)
    } else if (iotDelegations === totalDelegated && iotSubDao) {
      setDelegateAllSubDao(iotSubDao)
    } else if (mobileDelegations >= iotDelegations) {
      setDelegateAllSubDao(mobileSubDao)
    } else if (iotDelegations > mobileDelegations && iotSubDao) {
      setDelegateAllSubDao(iotSubDao)
    } else {
      setDelegateAllSubDao(mobileSubDao)
    }
  }, [subDaos, delegatedPositions, delegateAllSubDao])

  const {
    delegatePositions,
    rentFee: delegateAllSolFees = 0,
    prepaidTxFees: delegateAllPrepaidTxFees = 0,
    insufficientBalance: delegateAllInsufficientBalance = false,
    error: delegateAllError,
    loading: delegateAllLoading,
  } = useDelegatePositions({
    automationEnabled: delegateAllAutomationEnabled,
    positions: unexpiredPositions || [],
    subDao: delegateAllSubDao || undefined,
  })
  const handleDelegateAll = async () => {
    if (!delegatePositions) return
    await delegatePositions({
      onInstructions: async (ixs) => {
        await decideAndExecute({
          header: t('gov.transactions.delegatePosition'),
          message: t('gov.positions.delegateAllMessage', {
            subdao: delegateAllSubDao?.dntMetadata.name,
          }),
          instructions: ixs,
        })
      },
    })
    setIsDelegateAllModalOpen(false)
    refetchState()
  }

  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false)

  const navigation = useNavigation<GovernanceNavigationProp>()

  // Prepare action sheet data for ListItem
  const manageActions = [
    {
      label: t('gov.transactions.lockTokens'),
      value: 'lock',
      onPress: () => {
        setIsManageSheetOpen(false)
        setIsLockModalOpen(true)
      },
      disabled: claimingAllRewards || loading,
    },
    {
      label: t('gov.positions.delegateAll'),
      value: 'delegate',
      onPress: () => {
        setIsManageSheetOpen(false)
        setIsDelegateAllModalOpen(true)
      },
      disabled: loading || delegateAllLoading,
    },
    {
      label: t('gov.positions.proxyAll'),
      value: 'proxyAll',
      onPress: () => {
        setIsManageSheetOpen(false)
        navigation.navigate('AssignProxyScreen', {
          mint: mint.toBase58(),
          includeProxied: true,
        })
      },
      disabled: positions?.length === 0,
    },
    {
      label: t('gov.transactions.claimRewards'),
      value: 'claim',
      onPress: async () => {
        setIsManageSheetOpen(false)
        await handleClaimRewards()
      },
      disabled: !positionsWithRewards?.length || claimingAllRewards || loading,
      SecondaryIcon: positionsWithRewards?.length ? (
        <Dot filled color="green500" size={8} />
      ) : undefined,
    },
  ]

  return (
    <GovernanceWrapper selectedTab="positions">
      <Box flexDirection="column" flex={1}>
        <Box flex={1}>
          <PositionsList header={<VotingPowerCard marginBottom="l" />} />
        </Box>
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
        <Box flexDirection="row" paddingTop="m">
          {HNT_MINT.equals(mint) && (
            <Box flex={1} alignItems="center" flexDirection="row">
              {positions?.length === 0 ? (
                <ButtonPressable
                  height={44}
                  fontSize={12}
                  borderRadius="round"
                  borderWidth={2}
                  borderColor="white"
                  backgroundColorOpacityPressed={0.7}
                  title={t('gov.transactions.lockTokens')}
                  titleColor="white"
                  onPress={() => setIsLockModalOpen(true)}
                  flexDirection="row"
                  justifyContent="center"
                  alignItems="center"
                  innerContainerProps={{ justifyContent: 'center' }}
                />
              ) : (
                <>
                  <ButtonPressable
                    height={44}
                    fontSize={12}
                    borderRadius="round"
                    borderWidth={2}
                    borderColor="white"
                    backgroundColorOpacityPressed={0.7}
                    title={t('gov.manage')}
                    titleColor="white"
                    onPress={() => setIsManageSheetOpen(true)}
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center"
                    innerContainerProps={{ justifyContent: 'center' }}
                    Icon={
                      positionsWithRewards?.length
                        ? () => <Dot filled color="green500" size={8} />
                        : undefined
                    }
                  />
                  <BlurActionSheet
                    title={t('gov.manage')}
                    open={isManageSheetOpen}
                    onClose={() => setIsManageSheetOpen(false)}
                  >
                    <Box>
                      {manageActions.map((action) => (
                        <ListItem
                          key={action.value}
                          title={action.label}
                          onPress={action.onPress}
                          disabled={action.disabled}
                          SecondaryIcon={action.SecondaryIcon}
                          hasDivider
                        />
                      ))}
                    </Box>
                  </BlurActionSheet>
                </>
              )}
            </Box>
          )}
        </Box>
        {claimingAllRewards && <ClaimingRewardsModal status={statusOfClaim} />}
        {isLockModalOpen && (
          <LockTokensModal
            insufficientBalance={!!insufficientBalance}
            mint={mint}
            maxLockupAmount={maxLockupAmount}
            calcMultiplierFn={handleCalcLockupMultiplier}
            onClose={() => setIsLockModalOpen(false)}
            onSubmit={handleLockTokens}
            automationEnabled={automationEnabled}
            onSetAutomationEnabled={setAutomationEnabled}
            solFees={solFees || 0}
            prepaidTxFees={prepaidTxFees || 0}
          />
        )}
        {isDelegateAllModalOpen && (
          <DelegateTokensModal
            onClose={() => setIsDelegateAllModalOpen(false)}
            onSubmit={handleDelegateAll}
            onSetAutomationEnabled={setDelegateAllAutomationEnabled}
            automationEnabled={delegateAllAutomationEnabled}
            solFees={delegateAllSolFees}
            prepaidTxFees={delegateAllPrepaidTxFees}
            insufficientBalance={!!delegateAllInsufficientBalance}
            subDao={delegateAllSubDao}
            setSubDao={setDelegateAllSubDao}
          />
        )}
        {delegateAllError && (
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            paddingTop="ms"
          >
            <Text variant="body3Medium" color="red500">
              {delegateAllError.message}
            </Text>
          </Box>
        )}
      </Box>
    </GovernanceWrapper>
  )
}

export default PositionsScreen
