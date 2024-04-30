/* eslint-disable @typescript-eslint/no-shadow */
import { ReAnimatedBox } from '@components/AnimatedBox'
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { organizationKey } from '@helium/organization-sdk'
import {
  HNT_MINT,
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  humanReadable,
  populateMissingDraftInfo,
  sendAndConfirmWithRetry,
  toNumber,
  toVersionedTx,
} from '@helium/spl-utils'
import {
  PositionWithMeta,
  SubDaoWithMeta,
  calcLockupMultiplier,
  useClosePosition,
  useDelegatePosition,
  useExtendPosition,
  useFlipPositionLockupKind,
  useRegistrar,
  useRelinquishPositionVotes,
  useSplitPosition,
  useTransferPosition,
  useUndelegatePosition,
} from '@helium/voter-stake-registry-hooks'
import useAlert from '@hooks/useAlert'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { Keypair, TransactionInstruction } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import { useCreateOpacity } from '@theme/themeHooks'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import {
  daysToSecs,
  getMinDurationFmt,
  getTimeLeftFromNowFmt,
  secsToDays,
} from '@utils/dateTools'
import { getBasePriorityFee } from '@utils/walletApiV2'
import BN from 'bn.js'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { DelegateTokensModal } from './DelegateTokensModal'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { TransferTokensModal } from './TransferTokensModal'

interface IPositionCardProps extends Omit<BoxProps<Theme>, 'position'> {
  subDaos?: SubDaoWithMeta[]
  position: PositionWithMeta
}

export const PositionCard = ({
  position,
  subDaos,
  ...boxProps
}: IPositionCardProps) => {
  const { t } = useTranslation()
  const unixNow = useSolanaUnixNow(60 * 5 * 1000) || 0
  const { showOKAlert } = useAlert()
  const { walletSignBottomSheetRef } = useWalletSign()
  const [actionsOpen, setActionsOpen] = useState(false)
  const actionRef = useRef<
    null | 'undelegate' | 'relinquish' | 'flipLockupKind' | 'close'
  >(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false)
  const { positions, mint, network, refetch: refetchState } = useGovernance()
  const { backgroundStyle } = useCreateOpacity()
  const organization = useMemo(() => organizationKey(network)[0], [network])
  const transferablePositions: PositionWithMeta[] = useMemo(() => {
    if (!unixNow || !positions || !positions.length) {
      return []
    }

    const { lockup } = position
    const lockupKind = Object.keys(lockup.kind)[0]
    const positionLockupPeriodInDays = secsToDays(
      lockupKind === 'constant'
        ? lockup.endTs.sub(lockup.startTs).toNumber()
        : lockup.endTs.sub(new BN(unixNow || 0)).toNumber(),
    )

    return positions.filter((pos) => {
      const { lockup } = pos
      const lockupKind = Object.keys(lockup.kind)[0]
      const lockupPeriodInDays = secsToDays(
        lockupKind === 'constant'
          ? lockup.endTs.sub(lockup.startTs).toNumber()
          : lockup.endTs.sub(new BN(unixNow)).toNumber(),
      )

      return (
        (unixNow >= pos.genesisEnd.toNumber() ||
          unixNow <=
            position.votingMint.genesisVotePowerMultiplierExpirationTs.toNumber() ||
          !pos.hasGenesisMultiplier) &&
        !pos.isDelegated &&
        !position.pubkey.equals(pos.pubkey) &&
        lockupPeriodInDays >= positionLockupPeriodInDays
      )
    })
  }, [position, unixNow, positions])

  const { lockup, hasGenesisMultiplier, votingMint } = position
  const { info: mintAcc } = useMint(votingMint.mint)
  const {
    loading: loadingMetadata,
    symbol,
    json,
  } = useMetaplexMetadata(votingMint.mint)
  const lockupKind = Object.keys(lockup.kind)[0] as string
  const isConstant = lockupKind === 'constant'
  const lockupKindDisplay = isConstant
    ? t('gov.positions.constant')
    : t('gov.positions.decaying')
  const hasActiveVotes = position.numActiveVotes > 0
  const lockupExpired =
    !isConstant && lockup.endTs.sub(new BN(unixNow || 0)).lt(new BN(0))

  const lockedTokens =
    mintAcc && humanReadable(position.amountDepositedNative, mintAcc.decimals)

  const maxActionableAmount = mintAcc
    ? toNumber(position.amountDepositedNative, mintAcc)
    : 0
  const canDelegate = votingMint.mint.equals(HNT_MINT)

  const { info: registrar = null } = useRegistrar(position.registrar)

  const { anchorProvider } = useSolana()

  const decideAndExecute = async (
    header: string,
    instructions: TransactionInstruction[],
    sigs: Keypair[] = [],
  ) => {
    if (!anchorProvider || !walletSignBottomSheetRef) return

    const transactions = await batchInstructionsToTxsWithPriorityFee(
      anchorProvider,
      instructions,
      {
        basePriorityFee: await getBasePriorityFee(),
      },
    )
    const populatedDrafts = await Promise.all(
      transactions.map((tx) =>
        populateMissingDraftInfo(anchorProvider.connection, tx),
      ),
    )
    const txs = populatedDrafts.map((transaction) => toVersionedTx(transaction))

    const decision = await walletSignBottomSheetRef.show({
      type: WalletStandardMessageTypes.signTransaction,
      url: '',
      header,
      serializedTxs: txs.map((t) => Buffer.from(t.serialize())),
    })

    if (decision) {
      if (sigs.length) {
        let i = 0
        // eslint-disable-next-line no-restricted-syntax
        for (const tx of await anchorProvider.wallet.signAllTransactions(txs)) {
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          sigs.forEach((sig) => {
            if (
              transactions[i].signers?.some((s) =>
                s.publicKey.equals(sig.publicKey),
              )
            ) {
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
          undefined,
          undefined,
          sigs,
          MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
        )
      }
    } else {
      throw new Error('User rejected transaction')
    }
  }

  const handleCalcLockupMultiplier = useCallback(
    (lockupPeriodInDays: number) =>
      calcLockupMultiplier({
        lockupSecs: daysToSecs(lockupPeriodInDays),
        mint: votingMint.mint,
        registrar,
      }),
    [votingMint.mint, registrar],
  )

  const {
    loading: isExtending,
    error: extendingError,
    extendPosition,
  } = useExtendPosition()

  const {
    loading: isSpliting,
    error: splitingError,
    splitPosition,
  } = useSplitPosition()

  const {
    loading: isFlipping,
    error: flippingError,
    flipPositionLockupKind,
  } = useFlipPositionLockupKind()

  const {
    loading: isTransfering,
    error: transferingError,
    transferPosition,
  } = useTransferPosition()

  const {
    loading: isClosing,
    error: closingError,
    closePosition,
  } = useClosePosition()

  const {
    loading: isDelegating,
    error: delegatingError,
    delegatePosition,
  } = useDelegatePosition()

  const {
    loading: isUndelegating,
    error: undelegatingError,
    undelegatePosition,
  } = useUndelegatePosition()

  const {
    loading: isRelinquishing,
    error: relinquishingError,
    relinquishPositionVotes,
  } = useRelinquishPositionVotes()

  // used for actions that run right after clicking the action button
  useAsync(async () => {
    const ref = actionRef.current
    actionRef.current = null

    if (ref !== null) {
      await {
        relinquish: handleRelinquishVotes,
        flipLockupKind: handleFlipPositionLockupKind,
        undelegate: handleUndelegateTokens,
        close: handleClosePosition,
      }[ref]?.()
    }
  }, [actionRef.current])

  const transactionError = useMemo(() => {
    if (extendingError) {
      return extendingError.message || t('gov.errors.extendLockup')
    }

    if (splitingError) {
      return splitingError.message || t('gov.errors.splitTokens')
    }

    if (flippingError) {
      return (
        flippingError.message ||
        (isConstant
          ? t('gov.errors.pauseLockup')
          : t('gov.errors.unpauseLockup'))
      )
    }

    if (transferingError) {
      return transferingError.message || t('gov.errors.transferPosition')
    }

    if (closingError) {
      return closingError.message || t('gov.errors.closePosition')
    }

    if (delegatingError) {
      return delegatingError.message || t('gov.errors.delegatePosition')
    }

    if (undelegatingError) {
      return undelegatingError.message || t('gov.errors.undelegatePosition')
    }

    if (relinquishingError) {
      return relinquishingError.message || t('gov.errors.relinquishVotes')
    }
  }, [
    t,
    isConstant,
    extendingError,
    splitingError,
    flippingError,
    transferingError,
    closingError,
    delegatingError,
    undelegatingError,
    relinquishingError,
  ])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const handleClosePosition = async () => {
    await closePosition({
      position,
      onInstructions: async (ixs) => {
        await decideAndExecute(t('gov.transactions.closePosition'), ixs)
        if (!closingError) {
          refetchState()
        }
      },
    })
  }

  const handleFlipPositionLockupKind = async () => {
    await flipPositionLockupKind({
      position,
      onInstructions: async (ixs) => {
        await decideAndExecute(
          isConstant
            ? t('gov.transactions.unpauseLockup')
            : t('gov.transactions.pauseLockup'),
          ixs,
        )

        if (!flippingError) {
          refetchState()
        }
      },
    })
  }

  const handleExtendTokens = async (values: LockTokensModalFormValues) => {
    await extendPosition({
      position,
      lockupPeriodsInDays: values.lockupPeriodInDays,
      onInstructions: async (ixs) => {
        await decideAndExecute(t('gov.transactions.extendPosition'), ixs)
        if (!extendingError) {
          refetchState()
        }
      },
    })
  }

  const handleSplitTokens = async (values: LockTokensModalFormValues) => {
    await splitPosition({
      sourcePosition: position,
      amount: values.amount,
      lockupKind: values.lockupKind.value,
      lockupPeriodsInDays: values.lockupPeriodInDays,
      onInstructions: async (ixs, sigs) => {
        await decideAndExecute(t('gov.transactions.splitPosition'), ixs, sigs)
        if (!splitingError) {
          refetchState()
        }
      },
    })
  }

  const handleTransferTokens = async (
    targetPosition: PositionWithMeta,
    amount: number,
  ) => {
    await transferPosition({
      sourcePosition: position,
      amount,
      targetPosition,
      onInstructions: async (ixs) => {
        await decideAndExecute(t('gov.transactions.transferPosition'), ixs)
        if (!transferingError) {
          refetchState()
        }
      },
    })
  }

  const handleDelegateTokens = async (subDao: SubDaoWithMeta) => {
    await delegatePosition({
      position,
      subDao,
      onInstructions: async (ixs) => {
        await decideAndExecute(t('gov.transactions.delegatePosition'), ixs)
        if (!delegatingError) {
          refetchState()
        }
      },
    })
  }

  const handleUndelegateTokens = async () => {
    await undelegatePosition({
      position,
      onInstructions: async (ixs) => {
        const undelegate = ixs[ixs.length - 1]
        const claims = ixs.slice(0, ixs.length - 1)
        if (claims.length > 0) {
          await decideAndExecute(t('gov.transactions.claimRewards'), claims)
        }
        await decideAndExecute(t('gov.transactions.undelegatePosition'), [
          undelegate,
        ])
        if (!undelegatingError) {
          refetchState()
        }
      },
    })
  }

  const handleRelinquishVotes = async () => {
    await relinquishPositionVotes({
      position,
      organization,
      onInstructions: async (ixs) => {
        await decideAndExecute(t('gov.transactions.relinquishPosition'), ixs)
        if (!relinquishingError) {
          refetchState()
        }
      },
    })
  }

  const actions = () => {
    return (
      <>
        {position.isDelegated ? (
          <ListItem
            key="undelegate"
            title={t('gov.positions.undelegate')}
            onPress={async () => {
              setActionsOpen(false)
              actionRef.current = 'undelegate'
            }}
            selected={false}
            hasPressedState={false}
          />
        ) : (
          <>
            {lockupExpired ? (
              <ListItem
                key="close"
                title={t('gov.positions.close')}
                onPress={async () => {
                  setActionsOpen(false)
                  if (hasActiveVotes) {
                    showOKAlert({
                      title: t('gov.positions.unableToClose'),
                      message: t('gov.positions.partakingInVote'),
                    })
                  } else {
                    actionRef.current = 'close'
                  }
                }}
                selected={false}
                hasPressedState={false}
              />
            ) : (
              <>
                <ListItem
                  key="split"
                  title="Split"
                  onPress={() => {
                    setActionsOpen(false)
                    if (hasActiveVotes) {
                      showOKAlert({
                        title: t('gov.positions.unableToSplit'),
                        message: t('gov.positions.partakingInVote'),
                      })
                    } else {
                      setIsSplitModalOpen(true)
                    }
                  }}
                  selected={false}
                  hasPressedState={false}
                />
                <ListItem
                  key="transfer"
                  title="Transfer"
                  onPress={() => {
                    setActionsOpen(false)
                    if (hasActiveVotes) {
                      showOKAlert({
                        title: t('gov.positions.unableToTransfer'),
                        message: t('gov.positions.partakingInVote'),
                      })
                    } else {
                      setIsTransferModalOpen(true)
                    }
                  }}
                  selected={false}
                  hasPressedState={false}
                />
                <ListItem
                  key="extend"
                  title={t('gov.positions.extend')}
                  onPress={() => {
                    setActionsOpen(false)
                    setIsExtendModalOpen(true)
                  }}
                  selected={false}
                  hasPressedState={false}
                />
                <ListItem
                  key="pause"
                  title={
                    isConstant
                      ? t('gov.transactions.unpauseLockup')
                      : t('gov.transactions.pauseLockup')
                  }
                  onPress={async () => {
                    setActionsOpen(false)
                    if (hasActiveVotes) {
                      showOKAlert({
                        title: isConstant
                          ? t('gov.positions.unableToUnpauseLockup')
                          : t('gov.positions.unableToPauseLockup'),
                        message: t('gov.positions.partakingInVote'),
                      })
                    } else {
                      actionRef.current = 'flipLockupKind'
                    }
                  }}
                  selected={false}
                  hasPressedState={false}
                />
                {canDelegate && !position.isDelegated && (
                  <ListItem
                    key="delegate"
                    title={t('gov.positions.delegate')}
                    onPress={() => {
                      setActionsOpen(false)
                      setIsDelegateModalOpen(true)
                    }}
                    selected={false}
                    hasPressedState={false}
                  />
                )}
                {hasActiveVotes && (
                  <ListItem
                    key="relinquish"
                    title={t('gov.positions.relinquish')}
                    onPress={() => {
                      setActionsOpen(false)
                      actionRef.current = 'relinquish'
                    }}
                    selected={false}
                    hasPressedState={false}
                  />
                )}
              </>
            )}
          </>
        )}
      </>
    )
  }

  const delegatedSubDaoMetadata = position.delegatedSubDao
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      subDaos?.find((sd) => sd.pubkey.equals(position.delegatedSubDao!))
        ?.dntMetadata
    : null

  const isLoading = useMemo(
    () =>
      loadingMetadata ||
      isExtending ||
      isSpliting ||
      isClosing ||
      isTransfering ||
      isFlipping ||
      isDelegating ||
      isUndelegating ||
      isRelinquishing,
    [
      loadingMetadata,
      isExtending,
      isSpliting,
      isClosing,
      isTransfering,
      isFlipping,
      isDelegating,
      isUndelegating,
      isRelinquishing,
    ],
  )

  return (
    <>
      {isLoading && (
        <Box
          backgroundColor="surfaceSecondary"
          borderRadius="l"
          padding="m"
          paddingHorizontal="xl"
          {...boxProps}
        >
          <Box flex={1} alignItems="center">
            <Text variant="body2" color="primaryText">
              {isSpliting && t('gov.positions.splitting')}
              {isExtending && t('gov.positions.extending')}
              {isTransfering && t('gov.positions.transfering')}
              {isClosing && t('gov.positions.closing')}
              {isFlipping && isConstant && t('gov.positions.unlocking')}
              {isFlipping && !isConstant && t('gov.positions.pausing')}
              {isDelegating && t('gov.positions.delegating')}
              {isUndelegating && t('gov.positions.undelegating')}
              {isRelinquishing && t('gov.positions.relinquishing')}
            </Text>
            <Box flex={1} marginTop="ms" width="100%">
              <IndeterminateProgressBar height={6} />
            </Box>
          </Box>
        </Box>
      )}
      {!isLoading && (
        <>
          <ReAnimatedBox
            backgroundColor="surfaceSecondary"
            borderRadius="l"
            entering={FadeIn}
            exiting={FadeOut}
            {...boxProps}
          >
            <TouchableOpacityBox onPress={() => setActionsOpen(true)}>
              <Box paddingHorizontal="m" paddingVertical="ms">
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  marginBottom="m"
                >
                  <Box flexDirection="row" alignItems="center">
                    {json?.image ? (
                      <TokenIcon size={26} img={json.image} />
                    ) : undefined}
                    <Text
                      variant="subtitle3"
                      color="primaryText"
                      marginLeft="m"
                    >
                      {`${lockedTokens} ${symbol}`}
                    </Text>
                  </Box>
                  {hasGenesisMultiplier && (
                    <Box
                      padding="s"
                      paddingHorizontal="m"
                      backgroundColor="blueBright500"
                      borderRadius="m"
                    >
                      <Text variant="body3" fontSize={10} color="black">
                        {t('gov.positions.landrush').toUpperCase()}
                      </Text>
                    </Box>
                  )}
                </Box>
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  paddingBottom="s"
                >
                  <Box>
                    <Text variant="body2" color="secondaryText">
                      {t('gov.positions.lockupType')}
                    </Text>
                    <Text variant="body2" color="primaryText">
                      {lockupKindDisplay}
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      variant="body2"
                      color="secondaryText"
                      textAlign="right"
                    >
                      {t('gov.positions.voteMult')}
                    </Text>
                    <Text variant="body2" color="primaryText" textAlign="right">
                      {(
                        (position.votingPower.isZero()
                          ? 0
                          : // Mul by 100 to get 2 decimal places
                            position.votingPower
                              .mul(new BN(100))
                              .div(position.amountDepositedNative)
                              .toNumber() / 100) /
                        (position.genesisEnd.gt(new BN(unixNow || 0))
                          ? votingMint.genesisVotePowerMultiplier
                          : 1)
                      ).toFixed(2)}
                    </Text>
                  </Box>
                </Box>
                <Box flexDirection="row" justifyContent="space-between">
                  <Box>
                    <Text variant="body2" color="secondaryText">
                      {isConstant
                        ? t('gov.positions.minDur')
                        : t('gov.positions.timeLeft')}
                    </Text>
                    <Text variant="body2" color="primaryText">
                      {isConstant
                        ? getMinDurationFmt(
                            position.lockup.startTs,
                            position.lockup.endTs,
                          )
                        : getTimeLeftFromNowFmt(position.lockup.endTs)}
                    </Text>
                  </Box>
                  {hasGenesisMultiplier && (
                    <Box>
                      <Text
                        variant="body2"
                        color="secondaryText"
                        textAlign="right"
                      >
                        {t('gov.positions.landrush')}
                      </Text>
                      <Text
                        variant="body2"
                        color="primaryText"
                        textAlign="right"
                      >
                        {votingMint.genesisVotePowerMultiplier}x (
                        {getTimeLeftFromNowFmt(position.genesisEnd)})
                      </Text>
                    </Box>
                  )}
                </Box>
                {delegatedSubDaoMetadata && (
                  <Box
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Box
                      borderColor="black"
                      borderWidth={2}
                      borderRadius="round"
                    >
                      <TokenIcon
                        size={18}
                        img={delegatedSubDaoMetadata.json?.image || ''}
                      />
                    </Box>
                    <Text variant="body2" color="primaryText" marginLeft="m">
                      {delegatedSubDaoMetadata.name}
                    </Text>
                  </Box>
                )}
              </Box>
            </TouchableOpacityBox>
            {showError && (
              <Box
                flex={1}
                flexDirection="row"
                width="100%"
                height="100%"
                justifyContent="center"
                paddingVertical="ms"
                borderBottomLeftRadius="l"
                borderBottomRightRadius="l"
                style={backgroundStyle('error', 0.1)}
              >
                <Box flexDirection="row" alignSelf="center" marginRight="s">
                  <Text fontSize={10} color="error" marginLeft="s">
                    {showError}
                  </Text>
                </Box>
              </Box>
            )}
          </ReAnimatedBox>
          <BlurActionSheet
            title={t('gov.positions.actionsTitle')}
            open={actionsOpen}
            onClose={() => setActionsOpen(false)}
          >
            {actions()}
          </BlurActionSheet>
          {isExtendModalOpen && (
            <LockTokensModal
              mint={mint}
              mode="extend"
              minLockupTimeInDays={
                isConstant
                  ? Math.ceil(
                      secsToDays(
                        position.lockup.endTs
                          .sub(position.lockup.startTs)
                          .toNumber(),
                      ),
                    )
                  : Math.ceil(
                      secsToDays(
                        position.lockup.endTs.sub(new BN(unixNow)).toNumber(),
                      ),
                    )
              }
              maxLockupTimeInDays={secsToDays(
                votingMint.lockupSaturationSecs.toNumber(),
              )}
              maxLockupAmount={maxActionableAmount}
              calcMultiplierFn={handleCalcLockupMultiplier}
              onClose={() => setIsExtendModalOpen(false)}
              onSubmit={handleExtendTokens}
            />
          )}
          {isSplitModalOpen && (
            <LockTokensModal
              mint={mint}
              mode="split"
              minLockupTimeInDays={
                isConstant
                  ? Math.ceil(
                      secsToDays(
                        position.lockup.endTs
                          .sub(position.lockup.startTs)
                          .toNumber() + 1,
                      ),
                    )
                  : Math.ceil(
                      secsToDays(
                        position.lockup.endTs.sub(new BN(unixNow)).toNumber(),
                      ),
                    )
              }
              maxLockupTimeInDays={secsToDays(
                votingMint.lockupSaturationSecs.toNumber(),
              )}
              maxLockupAmount={maxActionableAmount}
              calcMultiplierFn={handleCalcLockupMultiplier}
              onClose={() => setIsSplitModalOpen(false)}
              onSubmit={handleSplitTokens}
            />
          )}
          {isTransferModalOpen && (
            <TransferTokensModal
              mint={mint}
              positions={transferablePositions}
              maxTransferAmount={maxActionableAmount}
              onClose={() => setIsTransferModalOpen(false)}
              onSubmit={handleTransferTokens}
            />
          )}
          {isDelegateModalOpen && (
            <DelegateTokensModal
              onClose={() => setIsDelegateModalOpen(false)}
              onSubmit={handleDelegateTokens}
            />
          )}
        </>
      )}
    </>
  )
}
