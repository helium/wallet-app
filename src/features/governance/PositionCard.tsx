/* eslint-disable @typescript-eslint/no-shadow */
import type { TokenAmountOutput } from '@helium/blockchain-api'
import BlurActionSheet from '@components/BlurActionSheet'
import ListItem from '@components/ListItem'
import { Pill } from '@components/Pill'
import { TASK_QUEUE, useDelegationClaimBot } from '@helium/automation-hooks'
import {
  useMint,
  useOwnedAmount,
  useSolanaUnixNow,
} from '@helium/helium-react-hooks'
import { EPOCH_LENGTH, delegatedPositionKey } from '@helium/helium-sub-daos-sdk'
import { delegationClaimBotKey } from '@helium/hpl-crons-sdk'
import { organizationKey } from '@helium/organization-sdk'
import { HNT_MINT, humanReadable, toBN, toNumber } from '@helium/spl-utils'
import {
  PositionWithMeta,
  SubDaoWithMeta,
  calcLockupMultiplier,
  useKnownProxy,
  useRegistrar,
} from '@helium/voter-stake-registry-hooks'
import useAlert from '@hooks/useAlert'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePositionDelegations } from '@hooks/usePositionDelegations'
import { useNavigation } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { twMerge } from '@ui/twMerge'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY, Mints } from '@utils/constants'
import {
  daysToSecs,
  getFormattedStringFromDays,
  getMinDurationFmt,
  getTimeLeftFromNowFmt,
  secsToDays,
} from '@utils/dateTools'
import { shortenAddress } from '@utils/formatting'
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
import { View } from 'react-native'
import { DelegateTokensModal } from './DelegateTokensModal'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { TransferTokensModal } from './TransferTokensModal'
import { GovernanceNavigationProp } from './governanceTypes'

interface IPositionCardProps {
  subDaos?: SubDaoWithMeta[]
  position: PositionWithMeta
  className?: string
}

export const PositionCard = ({
  position,
  subDaos,
  className,
}: IPositionCardProps) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const unixNow = useSolanaUnixNow(60 * 5 * 1000) || 0
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
  const { delegations, refetch: refetchDelegations } = usePositionDelegations()
  const delegation = delegations[position.mint.toBase58()]
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
  const delegationClaimBotK = delegationClaimBotKey(
    TASK_QUEUE,
    delegatedPositionKey(position.pubkey)[0],
  )[0]
  const { info: delegationClaimBot } =
    useDelegationClaimBot(delegationClaimBotK)
  const [automationEnabled, setAutomationEnabled] =
    useState(!!delegationClaimBot)
  const [prevDelegationClaimBot, setPrevDelegationClaimBot] =
    useState(delegationClaimBot)
  if (prevDelegationClaimBot !== delegationClaimBot) {
    setPrevDelegationClaimBot(delegationClaimBot)
    setAutomationEnabled(!!delegationClaimBot)
  }
  const [subDao, setSubDao] = useState<SubDaoWithMeta | null>(null)
  if (subDaos && !subDao) {
    const defaultSubDao = subDaos.find((sd) =>
      sd.pubkey.equals(position?.delegatedSubDao || MOBILE_SUB_DAO_KEY),
    )
    if (defaultSubDao) setSubDao(defaultSubDao)
  }
  const { positions, mint, network, refetch: refetchState } = useGovernance()
  const prepareDelegate = useEffectEvent(
    (delegateSubDao: SubDaoWithMeta, delegateAutomation: boolean) => {
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
    const minDays = isConstant
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
  const getTransferablePositions = (): PositionWithMeta[] => {
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
  }
  const transferablePositions = getTransferablePositions()

  const { lockup, isDelegated, hasGenesisMultiplier, votingMint } = position
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
  const decayedEpoch = lockup.endTs.div(new BN(EPOCH_LENGTH))
  const currentEpoch = new BN(unixNow).div(new BN(EPOCH_LENGTH))
  const isDecayed =
    !isConstant &&
    (isDelegated
      ? currentEpoch.gt(decayedEpoch)
      : lockup.endTs.lte(new BN(unixNow)))

  const lockedTokens =
    mintAcc && humanReadable(position.amountDepositedNative, mintAcc.decimals)

  const maxActionableAmount = mintAcc
    ? toNumber(position.amountDepositedNative, mintAcc)
    : 0
  const isInsufficientSol = (fee: TokenAmountOutput | null) => {
    if (!fee || typeof solBalance === 'undefined') return false
    return BigInt(fee.amount) > solBalance
  }
  const canDelegate = votingMint.mint.equals(HNT_MINT)

  const { info: registrar = null } = useRegistrar(position.registrar)

  const handleCalcLockupMultiplier = (lockupPeriodInDays: number) =>
    calcLockupMultiplier({
      lockupSecs: daysToSecs(lockupPeriodInDays),
      mint: votingMint.mint,
      registrar,
    })

  const handlePrepareExtend = (values: LockTokensModalFormValues) => {
    extendMutation
      .prepare({
        positionMint: position.mint.toBase58(),
        lockupPeriodsInDays: values.lockupPeriodInDays,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  }

  const handlePrepareSplit = (values: LockTokensModalFormValues) => {
    if (!mintAcc) return
    splitMutation
      .prepare({
        sourcePositionMint: position.mint.toBase58(),
        amount: toBN(values.amount, mintAcc.decimals).toString(),
        lockupKind: values.lockupKind.value,
        lockupPeriodsInDays: values.lockupPeriodInDays,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  }

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
  const transactionError = getTransactionError()

  const handleClosePosition = async () => {
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
    await extendMutation.submit(
      {
        positionMint: position.mint.toBase58(),
        lockupPeriodsInDays: values.lockupPeriodInDays,
      },
      {
        header: t('gov.transactions.extendPosition'),
        message: t('gov.positions.extendMessage', {
          existing: isConstant
            ? getMinDurationFmt(position.lockup.startTs, position.lockup.endTs)
            : getTimeLeftFromNowFmt(position.lockup.endTs),
          new: getFormattedStringFromDays(values.lockupPeriodInDays),
        }),
      },
    )
    refetchState()
  }

  const handleSplitTokens = async (values: LockTokensModalFormValues) => {
    await splitMutation.submit(
      {
        sourcePositionMint: position.mint.toBase58(),
        amount: toBN(values.amount, mintAcc!.decimals).toString(),
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
    await transferMutation.submit(
      {
        sourcePositionMint: position.mint.toBase58(),
        targetPositionMint: targetPosition.mint.toBase58(),
        amount: toBN(amount, mintAcc!.decimals).toString(),
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

  // Add status indicators for proxy and delegation
  const showProxyExpiringWarning =
    position.isProxyRenewable && !position.isProxyExpired
  const showProxyExpiredWarning = position.isProxyExpired
  const showDelegationExpiringWarning =
    position.isDelegationRenewable && !position.isDelegationExpired
  const showDelegationExpiredWarning = position.isDelegationExpired

  const actions = () => {
    const proxyAction =
      position.proxy && !position.proxy.nextVoter.equals(PublicKey.default) ? (
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

  const { knownProxy } = useKnownProxy(position?.proxy?.nextVoter)

  const delegatedSubDaoMetadata = position.delegatedSubDao
    ? subDaos?.find((sd) => sd.pubkey.equals(position.delegatedSubDao!))
        ?.dntMetadata
    : null

  const isLoading =
    loadingMetadata ||
    extendMutation.isPending ||
    splitMutation.isPending ||
    closeMutation.isPending ||
    transferMutation.isPending ||
    flipMutation.isPending ||
    delegateMutation.isPending ||
    undelegateMutation.isPending ||
    relinquishMutation.isPending

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
  const loadingText = getLoadingText()

  const pills = [
    {
      show: showProxyExpiringWarning,
      className: 'bg-warning-500',
      label: t('gov.positions.proxyExpiringSoon'),
    },
    {
      show: showProxyExpiredWarning,
      className: 'bg-destructive',
      label: t('gov.positions.proxyExpired'),
    },
    {
      show: showDelegationExpiringWarning,
      className: 'bg-warning-500',
      label: t('gov.positions.delegationExpiringSoon'),
    },
    {
      show: showDelegationExpiredWarning,
      className: 'bg-destructive',
      label: t('gov.positions.delegationExpired'),
    },
  ].filter((p) => p.show)

  const hasProxy =
    position.proxy && !position.proxy.nextVoter.equals(PublicKey.default)

  return (
    <>
      {isLoading && (
        <View
          className={twMerge('rounded-[12px] bg-secondary p-4 px-8', className)}
        >
          <View className="flex-1 items-center">
            <Text>{loadingText}</Text>
            <View className="mt-3 w-full flex-1 items-center">
              <Spinner />
            </View>
          </View>
        </View>
      )}
      {!isLoading && (
        <>
          <View className={twMerge('rounded-[12px] bg-secondary', className)}>
            <PressableScale
              testID="PositionCard"
              feedback="opacity"
              onPress={() => setActionsOpen(true)}
            >
              <View className="px-4 py-3">
                <View className="mb-4 flex-row justify-between">
                  <View className="flex-row items-center">
                    {json?.image ? (
                      <TokenIcon size={26} img={json.image} />
                    ) : undefined}
                    <Text size="base" className="ml-4 font-medium">
                      {`${lockedTokens} ${symbol}`}
                    </Text>
                  </View>
                  {hasGenesisMultiplier && (
                    <View className="rounded-md bg-blue-dark-500 p-2 px-4">
                      <Text className="text-[10px] text-black">
                        {t('gov.positions.landrush').toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                {pills.length > 0 && (
                  <View className="mb-2 flex-row">
                    {pills.map((p) => (
                      <View
                        key={p.label}
                        className={twMerge(
                          'mr-2 rounded-md p-2 px-4',
                          p.className,
                        )}
                      >
                        <Text className="text-[10px] text-black">
                          {p.label.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View className="flex-row justify-between pb-2">
                  <View>
                    <Text className="text-muted-foreground">
                      {t('gov.positions.lockupType')}
                    </Text>
                    <Text>{lockupKindDisplay}</Text>
                  </View>
                  <View>
                    <Text className="text-right text-muted-foreground">
                      {t('gov.positions.voteMult')}
                    </Text>
                    <Text className="text-right">
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
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-muted-foreground">
                      {isConstant
                        ? t('gov.positions.minDur')
                        : t('gov.positions.timeLeft')}
                    </Text>
                    <Text>
                      {isConstant
                        ? getMinDurationFmt(lockup.startTs, lockup.endTs)
                        : isDelegated
                          ? getTimeLeftFromNowFmt(
                              lockup.endTs.add(new BN(EPOCH_LENGTH)),
                            )
                          : getTimeLeftFromNowFmt(lockup.endTs)}
                    </Text>
                  </View>
                  {hasGenesisMultiplier && (
                    <View>
                      <Text className="text-right text-muted-foreground">
                        {t('gov.positions.landrush')}
                      </Text>
                      <Text className="text-right">
                        {votingMint.genesisVotePowerMultiplier}x (
                        {getTimeLeftFromNowFmt(position.genesisEnd)})
                      </Text>
                    </View>
                  )}
                </View>
                <View className="mt-2 flex-row justify-between">
                  {delegatedSubDaoMetadata ? (
                    <View>
                      <Text className="text-muted-foreground">
                        {t('gov.positions.delegatedTo')}
                      </Text>
                      <View className="mt-2 flex-row items-center justify-center">
                        <View className="rounded-full border-2 border-black">
                          <TokenIcon
                            size={18}
                            img={delegatedSubDaoMetadata.json?.image || ''}
                          />
                        </View>
                        <Text className="ml-2">
                          {delegatedSubDaoMetadata.name}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {hasProxy ? (
                    <View
                      className={
                        delegatedSubDaoMetadata ? 'items-end' : 'items-start'
                      }
                    >
                      <Text className="text-muted-foreground">
                        {t('gov.positions.proxiedTo')}
                      </Text>
                      <View className="mt-2">
                        <Pill
                          color="red"
                          text={
                            knownProxy?.name ||
                            shortenAddress(position.proxy!.nextVoter.toBase58())
                          }
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </PressableScale>
            {transactionError && (
              <View className="w-full flex-1 flex-row justify-center rounded-b-[12px] bg-destructive/10 py-3">
                <View className="mr-2 flex-row self-center">
                  <Text className="ml-2 text-[10px] text-destructive">
                    {transactionError}
                  </Text>
                </View>
              </View>
            )}
          </View>
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
              positions={transferablePositions}
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
      )}
    </>
  )
}
