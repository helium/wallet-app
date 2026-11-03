/* eslint-disable @typescript-eslint/no-shadow */
import type { TokenAmountOutput } from '@helium/blockchain-api'
import { BlurActionSheet } from '@ui/BlurActionSheet'
import { ListItem } from '@ui/ListItem'
import { TASK_QUEUE, useDelegationClaimBot } from '@helium/automation-hooks'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { EPOCH_LENGTH, delegatedPositionKey } from '@helium/helium-sub-daos-sdk'
import { delegationClaimBotKey } from '@helium/hpl-crons-sdk'
import { organizationKey } from '@helium/organization-sdk'
import { HNT_MINT, humanReadable, toBN, toNumber } from '@helium/spl-utils'
import {
  PositionWithMeta,
  SubDaoWithMeta,
  calcLockupMultiplier,
  useRegistrar,
} from '@helium/voter-stake-registry-hooks'
import useAlert from '@hooks/useAlert'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { usePositionDelegations } from '@hooks/usePositionDelegations'
import { useNavigation } from '@react-navigation/native'
import { Mint, NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY, Mints } from '@utils/constants'
import {
  daysToSecs,
  getFormattedStringFromDays,
  getMinDurationFmt,
  getTimeLeftFromNowFmt,
  secsToDays,
} from '@utils/dateTools'
import BN from 'bn.js'
import {
  useExtendPositionMutation,
  useSplitPositionMutation,
  useFlipLockupKindMutation,
  useTransferPositionMutation,
  useClosePositionMutation,
  useDelegatePositionMutation,
  useUndelegatePositionMutation,
  useRelinquishPositionVotesMutation,
} from '@hooks/useGovernanceMutations'
import React, { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DelegateTokensModal } from './DelegateTokensModal'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { TransferTokensModal } from './TransferTokensModal'
import { GovernanceNavigationProp } from './governanceTypes'

const isConstantLockup = (position: PositionWithMeta) =>
  Object.keys(position.lockup.kind)[0] === 'constant'

interface IPositionActionsArgs {
  subDaos?: SubDaoWithMeta[]
  unixNow: number
  mintAcc?: Mint
  symbol?: string
}

// The action sheet, the modals and the transactions of one position at a
// time, for a list of positions. Each row stays a plain view: it opens the
// actions with `openActions` and shows `statusOf` for its position.
export const usePositionActions = ({
  subDaos,
  unixNow,
  mintAcc,
  symbol,
}: IPositionActionsArgs) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const { amount: solBalance } = useOwnedAmount(wallet, NATIVE_MINT)
  const { showOKAlert } = useAlert()
  const extendMutation = useExtendPositionMutation()
  const splitMutation = useSplitPositionMutation()
  const flipMutation = useFlipLockupKindMutation()
  const transferMutation = useTransferPositionMutation()
  const closeMutation = useClosePositionMutation()
  const delegateMutation = useDelegatePositionMutation()
  const undelegateMutation = useUndelegatePositionMutation()
  const relinquishMutation = useRelinquishPositionVotesMutation()
  const mutations = [
    extendMutation,
    splitMutation,
    flipMutation,
    transferMutation,
    closeMutation,
    delegateMutation,
    undelegateMutation,
    relinquishMutation,
  ]
  const isPending = mutations.some((m) => m.isPending)
  const { positions, mint, network, refetch: refetchState } = useGovernance()
  // The key, not the position: a refetch replaces the position objects
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const position = activeKey
    ? positions?.find((p) => p.pubkey.toBase58() === activeKey)
    : undefined
  const { delegations, refetch: refetchDelegations } = usePositionDelegations()
  const delegation = position && delegations[position.mint.toBase58()]
  const [actionsOpen, setActionsOpen] = useState(false)
  // An object, not the bare action: a repeat tap of the same action gets a new
  // identity, so the effect re-runs
  const [pendingAction, setPendingAction] = useState<null | {
    action: 'undelegate' | 'relinquish' | 'flipLockupKind' | 'close'
  }>(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false)
  const delegationClaimBotK = position
    ? delegationClaimBotKey(
        TASK_QUEUE,
        delegatedPositionKey(position.pubkey)[0],
      )[0]
    : undefined
  const { info: delegationClaimBot, loading: loadingClaimBot } =
    useDelegationClaimBot(delegationClaimBotK)
  const [automationEnabled, setAutomationEnabled] =
    useState(!!delegationClaimBot)
  const claimBotKeyStr = delegationClaimBotK?.toBase58()
  const [seenClaimBot, setSeenClaimBot] = useState({
    key: claimBotKeyStr,
    hasBot: !!delegationClaimBot,
  })
  if (seenClaimBot.key !== claimBotKeyStr) {
    setSeenClaimBot({ key: claimBotKeyStr, hasBot: false })
    setAutomationEnabled(false)
  } else if (!loadingClaimBot && seenClaimBot.hasBot !== !!delegationClaimBot) {
    setSeenClaimBot({ key: claimBotKeyStr, hasBot: !!delegationClaimBot })
    setAutomationEnabled(!!delegationClaimBot)
  }
  const [subDao, setSubDao] = useState<SubDaoWithMeta | null>(null)
  if (position && subDaos && !subDao) {
    const defaultSubDao = subDaos.find((sd) =>
      sd.pubkey.equals(position.delegatedSubDao || MOBILE_SUB_DAO_KEY),
    )
    if (defaultSubDao) setSubDao(defaultSubDao)
  }

  // A tap on another position while a transaction runs does nothing: the
  // mutations track one position at a time
  const openActions = (next: PositionWithMeta) => {
    const nextKey = next.pubkey.toBase58()
    if (nextKey !== activeKey) {
      if (isPending) return
      mutations.forEach((m) => m.reset())
      setActiveKey(nextKey)
      setSeenClaimBot({ key: undefined, hasBot: false })
      setSubDao(null)
    }
    setActionsOpen(true)
  }

  const prepareDelegate = useEffectEvent(
    (delegateSubDao: SubDaoWithMeta, delegateAutomation: boolean) => {
      if (!position) return
      const subDaoMint = delegateSubDao.pubkey.equals(IOT_SUB_DAO_KEY)
        ? Mints.IOT
        : Mints.MOBILE
      delegateMutation
        .prepare({
          positionMints: [position.mint.toBase58()],
          subDaoMint,
          automationEnabled: delegateAutomation,
        })
        .catch((e) => console.warn('Fee estimate failed:', e))
    },
  )
  useEffect(() => {
    if (isDelegateModalOpen && subDao) {
      prepareDelegate(subDao, automationEnabled)
    }
  }, [isDelegateModalOpen, subDao, automationEnabled])
  const prepareExtend = useEffectEvent(() => {
    if (!position) return
    const minDays = isConstantLockup(position)
      ? Math.ceil(
          secsToDays(
            position.lockup.endTs.sub(position.lockup.startTs).toNumber(),
          ),
        )
      : Math.ceil(
          secsToDays(position.lockup.endTs.sub(new BN(unixNow)).toNumber()),
        )
    extendMutation
      .prepare({
        positionMint: position.mint.toBase58(),
        lockupPeriodsInDays: minDays,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  })
  useEffect(() => {
    if (isExtendModalOpen) {
      prepareExtend()
    }
  }, [isExtendModalOpen])
  const prepareSplit = useEffectEvent(() => {
    if (!position) return
    const isConstant = isConstantLockup(position)
    const minDays = isConstant
      ? Math.ceil(
          secsToDays(
            position.lockup.endTs.sub(position.lockup.startTs).toNumber() + 1,
          ),
        )
      : Math.ceil(
          secsToDays(position.lockup.endTs.sub(new BN(unixNow)).toNumber()),
        )
    splitMutation
      .prepare({
        sourcePositionMint: position.mint.toBase58(),
        amount: position.amountDepositedNative.toString(),
        lockupKind: isConstant ? 'constant' : 'cliff',
        lockupPeriodsInDays: minDays,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  })
  useEffect(() => {
    if (isSplitModalOpen) {
      prepareSplit()
    }
  }, [isSplitModalOpen])
  const organization = organizationKey(network)[0]
  const getTransferablePositions = (
    position: PositionWithMeta,
  ): PositionWithMeta[] => {
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
        !pos.isProxiedToMe &&
        !position.pubkey.equals(pos.pubkey) &&
        lockupPeriodInDays >= positionLockupPeriodInDays
      )
    })
  }

  const lockedTokens =
    position &&
    mintAcc &&
    humanReadable(position.amountDepositedNative, mintAcc.decimals)

  const maxActionableAmount =
    position && mintAcc ? toNumber(position.amountDepositedNative, mintAcc) : 0
  const isInsufficientSol = (fee: TokenAmountOutput | null) => {
    if (!fee || typeof solBalance === 'undefined') return false
    return BigInt(fee.amount) > solBalance
  }

  const { info: registrar = null } = useRegistrar(position?.registrar)

  const handleCalcLockupMultiplier = (lockupPeriodInDays: number) =>
    calcLockupMultiplier({
      lockupSecs: daysToSecs(lockupPeriodInDays),
      mint: position!.votingMint.mint,
      registrar,
    })

  const handlePrepareExtend = (values: LockTokensModalFormValues) => {
    if (!position) return
    extendMutation
      .prepare({
        positionMint: position.mint.toBase58(),
        lockupPeriodsInDays: values.lockupPeriodInDays,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  }

  const handlePrepareSplit = (values: LockTokensModalFormValues) => {
    if (!position || !mintAcc) return
    splitMutation
      .prepare({
        sourcePositionMint: position.mint.toBase58(),
        amount: BN.min(
          toBN(values.amount, mintAcc.decimals),
          position.amountDepositedNative,
        ).toString(),
        lockupKind: values.lockupKind.value,
        lockupPeriodsInDays: values.lockupPeriodInDays,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  }

  // The spinner text and error strip of a row. Only the position whose
  // actions were opened last has any.
  const statusOf = (row: PositionWithMeta) => {
    if (row.pubkey.toBase58() !== activeKey) {
      return { loadingText: null, transactionError: undefined }
    }
    const isConstant = isConstantLockup(row)
    const getTransactionError = () => {
      const sources: [Error | null, string][] = [
        [extendMutation.error, t('gov.errors.extendLockup')],
        [splitMutation.error, t('gov.errors.splitTokens')],
        [
          flipMutation.error,
          isConstant
            ? t('gov.errors.pauseLockup')
            : t('gov.errors.unpauseLockup'),
        ],
        [transferMutation.error, t('gov.errors.transferPosition')],
        [closeMutation.error, t('gov.errors.closePosition')],
        [delegateMutation.error, t('gov.errors.delegatePosition')],
        [undelegateMutation.error, t('gov.errors.undelegatePosition')],
        [relinquishMutation.error, t('gov.errors.relinquishVotes')],
      ]
      const found = sources.find(([err]) => err)
      if (!found) return undefined
      return found[0]!.message || found[1]
    }
    const getLoadingText = () => {
      if (splitMutation.isPending) return t('gov.positions.splitting')
      if (extendMutation.isPending) return t('gov.positions.extending')
      if (transferMutation.isPending) return t('gov.positions.transfering')
      if (closeMutation.isPending) return t('gov.positions.closing')
      if (flipMutation.isPending)
        return isConstant
          ? t('gov.positions.unlocking')
          : t('gov.positions.pausing')
      if (delegateMutation.isPending) return t('gov.positions.delegating')
      if (undelegateMutation.isPending) return t('gov.positions.undelegating')
      if (relinquishMutation.isPending) return t('gov.positions.relinquishing')
      return null
    }
    return {
      loadingText: getLoadingText(),
      transactionError: getTransactionError(),
    }
  }

  const handleClosePosition = async () => {
    if (!position) return
    await closeMutation.submit(
      { positionMint: position.mint.toBase58() },
      {
        header: t('gov.transactions.closePosition'),
        message: t('gov.positions.closeMessage'),
      },
    )
    refetchState()
  }

  const handleFlipPositionLockupKind = async () => {
    if (!position) return
    const isConstant = isConstantLockup(position)
    await flipMutation.submit(
      { positionMint: position.mint.toBase58() },
      {
        header: isConstant
          ? t('gov.transactions.unpauseLockup')
          : t('gov.transactions.pauseLockup'),
        message: t('gov.positions.flipLockupMessage', {
          amount: lockedTokens,
          symbol,
          status: isConstant ? 'paused' : 'decaying',
          action: isConstant ? 'let it decay' : 'pause it',
        }),
      },
    )
    refetchState()
  }

  const handleExtendTokens = async (values: LockTokensModalFormValues) => {
    if (!position) return
    await extendMutation.submit(
      {
        positionMint: position.mint.toBase58(),
        lockupPeriodsInDays: values.lockupPeriodInDays,
      },
      {
        header: t('gov.transactions.extendPosition'),
        message: t('gov.positions.extendMessage', {
          existing: isConstantLockup(position)
            ? getMinDurationFmt(position.lockup.startTs, position.lockup.endTs)
            : getTimeLeftFromNowFmt(position.lockup.endTs),
          new: getFormattedStringFromDays(values.lockupPeriodInDays),
        }),
      },
    )
    refetchState()
  }

  const handleSplitTokens = async (values: LockTokensModalFormValues) => {
    if (!position) return
    await splitMutation.submit(
      {
        sourcePositionMint: position.mint.toBase58(),
        amount: BN.min(
          toBN(values.amount, mintAcc!.decimals),
          position.amountDepositedNative,
        ).toString(),
        lockupKind: values.lockupKind.value,
        lockupPeriodsInDays: values.lockupPeriodInDays,
      },
      {
        header: t('gov.transactions.splitPosition'),
        message: t('gov.positions.splitMessage', {
          amount: values.amount,
          symbol,
          lockupKind: values.lockupKind.display.toLocaleLowerCase(),
          duration: getFormattedStringFromDays(values.lockupPeriodInDays),
        }),
      },
    )
    refetchState()
  }

  const handleTransferTokens = async (
    targetPosition: PositionWithMeta,
    amount: number,
  ) => {
    if (!position) return
    await transferMutation.submit(
      {
        sourcePositionMint: position.mint.toBase58(),
        targetPositionMint: targetPosition.mint.toBase58(),
        amount: BN.min(
          toBN(amount, mintAcc!.decimals),
          position.amountDepositedNative,
        ).toString(),
      },
      {
        header: t('gov.transactions.transferPosition'),
        message: t('gov.positions.transferMessage', {
          amount,
          symbol,
          targetAmount: humanReadable(
            targetPosition.amountDepositedNative,
            mintAcc!.decimals,
          ),
        }),
      },
    )
    refetchState()
  }

  const handleDelegateTokens = async () => {
    if (!position) return
    const subDaoMint = subDao?.pubkey.equals(IOT_SUB_DAO_KEY)
      ? Mints.IOT
      : Mints.MOBILE

    await delegateMutation.submit(
      {
        positionMints: [position.mint.toBase58()],
        subDaoMint,
        automationEnabled,
      },
      {
        header: t('gov.transactions.delegatePosition'),
        message: t('gov.positions.delegateMessage', {
          amount: lockedTokens,
          symbol,
          subdao: subDao?.dntMetadata.name,
        }),
      },
    )
    refetchState()
    void refetchDelegations()
  }

  const handleUndelegateTokens = async () => {
    if (!position) return
    await undelegateMutation.submit(
      { positionMint: position.mint.toBase58() },
      {
        header: t('gov.transactions.undelegatePosition'),
        message: t('gov.positions.undelegateMessage', {
          amount: lockedTokens,
          symbol,
        }),
      },
    )
    refetchState()
    void refetchDelegations()
  }

  const handleRelinquishVotes = async () => {
    if (!position) return
    await relinquishMutation.submit(
      {
        positionMint: position.mint.toBase58(),
        organization: organization.toBase58(),
      },
      {
        header: t('gov.transactions.relinquishPosition'),
        message: t('gov.positions.relinquishVotesMessage'),
      },
    )
    refetchState()
  }

  // used for actions that run right after clicking the action button
  const runPendingAction = useEffectEvent(async () => {
    if (pendingAction !== null) {
      await {
        relinquish: handleRelinquishVotes,
        flipLockupKind: handleFlipPositionLockupKind,
        undelegate: handleUndelegateTokens,
        close: handleClosePosition,
      }[pendingAction.action]?.()
    }
  })
  useEffect(() => {
    runPendingAction().catch((e) => console.error(e))
  }, [pendingAction])

  const govNavigation = useNavigation<GovernanceNavigationProp>()

  const renderSheets = (position: PositionWithMeta) => {
    const { lockup, isDelegated, votingMint } = position
    const isConstant = isConstantLockup(position)
    const hasActiveVotes = position.numActiveVotes > 0
    const decayedEpoch = lockup.endTs.div(new BN(EPOCH_LENGTH))
    const currentEpoch = new BN(unixNow).div(new BN(EPOCH_LENGTH))
    const isDecayed =
      !isConstant &&
      (isDelegated
        ? currentEpoch.gt(decayedEpoch)
        : lockup.endTs.lte(new BN(unixNow)))
    const canDelegate = votingMint.mint.equals(HNT_MINT)
    const showProxyExpiringWarning =
      position.isProxyRenewable && !position.isProxyExpired
    const showProxyExpiredWarning = position.isProxyExpired
    const showDelegationExpiringWarning =
      position.isDelegationRenewable && !position.isDelegationExpired
    const showDelegationExpiredWarning = position.isDelegationExpired

    const actions = () => {
      const proxyAction =
        position.proxy &&
        !position.proxy.nextVoter.equals(PublicKey.default) ? (
          <>
            {(showProxyExpiringWarning || showProxyExpiredWarning) && (
              <ListItem
                key="renewProxy"
                title={t('gov.positions.renewProxy')}
                onPress={() => {
                  setActionsOpen(false)
                  govNavigation.navigate('AssignProxyScreen', {
                    mint: votingMint.mint.toBase58(),
                    position: position.pubkey.toBase58(),
                    wallet: position.proxy?.nextVoter?.toBase58(),
                  })
                }}
                selected={false}
                hasPressedState={false}
              />
            )}
            <ListItem
              key="revokeProxy"
              title={t('gov.revokeProxy.title')}
              onPress={() => {
                setActionsOpen(false)
                govNavigation.navigate('RevokeProxyScreen', {
                  mint: votingMint.mint.toBase58(),
                  position: position.pubkey.toBase58(),
                  wallet: position.proxy?.nextVoter?.toBase58(),
                })
              }}
              selected={false}
              hasPressedState={false}
            />
          </>
        ) : (
          <ListItem
            key="proxy"
            title={t('gov.assignProxy.title')}
            onPress={() => {
              setActionsOpen(false)
              govNavigation.navigate('AssignProxyScreen', {
                mint: votingMint.mint.toBase58(),
                position: position.pubkey.toBase58(),
              })
            }}
            selected={false}
            hasPressedState={false}
          />
        )
      return (
        <>
          {isDelegated ? (
            <>
              <ListItem
                key="undelegate"
                title={t('gov.positions.undelegate')}
                onPress={() => {
                  setActionsOpen(false)
                  // undelegate has to claim every unclaimed epoch first, which
                  // fails on-chain while any of them is still awaiting issuance
                  if (delegation?.unissuedRequiredEpochCount) {
                    void showOKAlert({
                      title: t('gov.positions.unableToUndelegate'),
                      message: t('gov.positions.rewardsPendingIssuance', {
                        count: delegation.unissuedRequiredEpochCount,
                      }),
                    })
                  } else {
                    setPendingAction({ action: 'undelegate' })
                  }
                }}
                selected={false}
                hasPressedState={false}
              />
              {canDelegate && !isDecayed && (
                <>
                  {(showDelegationExpiringWarning ||
                    showDelegationExpiredWarning) && (
                    <ListItem
                      key="renewDelegation"
                      title={t('gov.positions.renewDelegation')}
                      onPress={() => {
                        setActionsOpen(false)
                        setIsDelegateModalOpen(true)
                      }}
                      selected={false}
                      hasPressedState={false}
                    />
                  )}
                  <ListItem
                    key="delegate"
                    title={t('gov.positions.changeDelegation')}
                    onPress={() => {
                      setActionsOpen(false)
                      setIsDelegateModalOpen(true)
                    }}
                    selected={false}
                    hasPressedState={false}
                  />
                </>
              )}
              {proxyAction}
            </>
          ) : (
            <>
              {isDecayed ? (
                <ListItem
                  key="close"
                  title={t('gov.positions.close')}
                  onPress={() => {
                    setActionsOpen(false)
                    if (hasActiveVotes) {
                      void showOKAlert({
                        title: t('gov.positions.unableToClose'),
                        message: t('gov.positions.partakingInVote'),
                      })
                    } else {
                      setPendingAction({ action: 'close' })
                    }
                  }}
                  selected={false}
                  hasPressedState={false}
                />
              ) : (
                <>
                  {!position.isProxiedToMe && (
                    <>
                      <ListItem
                        key="split"
                        title="Split"
                        onPress={() => {
                          setActionsOpen(false)
                          if (hasActiveVotes) {
                            void showOKAlert({
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
                            void showOKAlert({
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
                        onPress={() => {
                          setActionsOpen(false)
                          if (hasActiveVotes) {
                            void showOKAlert({
                              title: isConstant
                                ? t('gov.positions.unableToUnpauseLockup')
                                : t('gov.positions.unableToPauseLockup'),
                              message: t('gov.positions.partakingInVote'),
                            })
                          } else {
                            setPendingAction({ action: 'flipLockupKind' })
                          }
                        }}
                        selected={false}
                        hasPressedState={false}
                      />
                    </>
                  )}
                  {canDelegate && (
                    <ListItem
                      key="delegate"
                      testID="PositionCard.Delegate"
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
                        setPendingAction({ action: 'relinquish' })
                      }}
                      selected={false}
                      hasPressedState={false}
                    />
                  )}
                  {proxyAction}
                </>
              )}
            </>
          )}
        </>
      )
    }

    return (
      <>
        <BlurActionSheet
          title={t('gov.positions.actionsTitle')}
          open={actionsOpen}
          onClose={() => setActionsOpen(false)}
        >
          {actions()}
        </BlurActionSheet>
        {isExtendModalOpen && (
          <LockTokensModal
            insufficientBalance={isInsufficientSol(
              extendMutation.estimatedSolFee,
            )}
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
            onPrepare={handlePrepareExtend}
            automationEnabled={false}
            onSetAutomationEnabled={() => {}}
            estimatedSolFee={extendMutation.estimatedSolFee?.uiAmountString}
          />
        )}
        {isSplitModalOpen && (
          <LockTokensModal
            insufficientBalance={isInsufficientSol(
              splitMutation.estimatedSolFee,
            )}
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
            onPrepare={handlePrepareSplit}
            automationEnabled={false}
            onSetAutomationEnabled={() => {}}
            estimatedSolFee={splitMutation.estimatedSolFee?.uiAmountString}
          />
        )}
        {isTransferModalOpen && (
          <TransferTokensModal
            mint={mint}
            positions={getTransferablePositions(position)}
            maxTransferAmount={maxActionableAmount}
            onClose={() => setIsTransferModalOpen(false)}
            onSubmit={handleTransferTokens}
          />
        )}
        {isDelegateModalOpen && (
          <DelegateTokensModal
            automationEnabled={automationEnabled}
            onSetAutomationEnabled={setAutomationEnabled}
            onClose={() => setIsDelegateModalOpen(false)}
            onSubmit={handleDelegateTokens}
            estimatedSolFee={delegateMutation.estimatedSolFee?.uiAmountString}
            insufficientBalance={isInsufficientSol(
              delegateMutation.estimatedSolFee,
            )}
            subDao={subDao}
            setSubDao={setSubDao}
          />
        )}
      </>
    )
  }

  // The row shows a spinner in place of its sheets while a transaction runs
  return {
    openActions,
    statusOf,
    sheets: position && !isPending ? renderSheets(position) : null,
  }
}
