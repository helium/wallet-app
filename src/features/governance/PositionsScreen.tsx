import { BlurActionSheet } from '@ui/BlurActionSheet'
import { Dot } from '@ui/Dot'
import { ListItem } from '@ui/ListItem'
import type { TokenAmountOutput } from '@helium/blockchain-api'
import { useOwnedAmount, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { HNT_MINT, humanReadable, toBN, toNumber } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'
import {
  PositionWithMeta,
  SubDaoWithMeta,
  calcLockupMultiplier,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import {
  useCreatePositionMutation,
  useClaimRewardsMutation,
  useDelegatePositionMutation,
} from '@hooks/useGovernanceMutations'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePositionDelegations } from '@hooks/usePositionDelegations'
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Text } from '@ui/Text'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY, Mints } from '@utils/constants'
import { daysToSecs, getFormattedStringFromDays } from '@utils/dateTools'
import BN from 'bn.js'
import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { ClaimingRewardsModal } from './ClaimingRewardsModal'
import { DelegateTokensModal } from './DelegateTokensModal'
import GovernanceWrapper from './GovernanceWrapper'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceNavigationProp } from './governanceTypes'

const TabSafeArea = withUniwind(TabSafeAreaView)

const BOTTOM_EDGE = ['bottom'] as const

const getDefaultDelegateAllSubDao = (
  subDaos: SubDaoWithMeta[] | undefined,
  delegatedPositions: PositionWithMeta[] | undefined,
): SubDaoWithMeta | undefined => {
  if (!subDaos || !delegatedPositions) return undefined
  const mobileSubDao = subDaos.find((sd) =>
    sd.pubkey.equals(MOBILE_SUB_DAO_KEY),
  )
  const iotSubDao = subDaos.find((sd) => sd.pubkey.equals(IOT_SUB_DAO_KEY))
  if (!mobileSubDao) return undefined

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
    return mobileSubDao
  }
  if (mobileDelegations === totalDelegated) {
    return mobileSubDao
  }
  if (iotDelegations === totalDelegated && iotSubDao) {
    return iotSubDao
  }
  if (mobileDelegations >= iotDelegations) {
    return mobileSubDao
  }
  if (iotDelegations > mobileDelegations && iotSubDao) {
    return iotSubDao
  }
  return mobileSubDao
}

export const PositionsScreen = () => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const {
    mint,
    registrar,
    loading,
    refetch: refetchState,
    positions,
  } = useGovernance()
  const { symbol } = useMetaplexMetadata(mint)
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const { amount: solBalance } = useOwnedAmount(wallet, NATIVE_MINT)
  const createPositionMutation = useCreatePositionMutation()
  const claimRewardsMutation = useClaimRewardsMutation()
  const delegateAllMutation = useDelegatePositionMutation()
  const { delegations, refetch: refetchDelegations } = usePositionDelegations()

  const positionsWithRewards = useMemo(
    () =>
      positions?.filter(
        (p) => (delegations[p.mint.toBase58()]?.claimableEpochCount ?? 0) > 0,
      ),
    [positions, delegations],
  )

  const transactionError = useMemo(() => {
    if (createPositionMutation.error) {
      return createPositionMutation.error.message || t('gov.errors.lockTokens')
    }

    if (claimRewardsMutation.error) {
      return claimRewardsMutation.error.message || t('gov.errors.claimRewards')
    }

    return undefined
  }, [createPositionMutation.error, claimRewardsMutation.error, t])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const isInsufficientSol = useCallback(
    (fee: TokenAmountOutput | null) => {
      if (!fee || typeof solBalance === 'undefined') return false
      return BigInt(fee.amount) > solBalance
    },
    [solBalance],
  )

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

  const handlePrepareCreatePosition = (values: LockTokensModalFormValues) => {
    if (!decimals) return
    const amountToLock = toBN(values.amount, decimals)
    const subDaoMint = values.subDao
      ? values.subDao.pubkey.equals(IOT_SUB_DAO_KEY)
        ? Mints.IOT
        : Mints.MOBILE
      : undefined

    createPositionMutation
      .prepare({
        amount: amountToLock.toString(),
        lockupKind: values.lockupKind.value,
        lockupPeriodsInDays: values.lockupPeriodInDays,
        mint: mint.toBase58(),
        subDaoMint,
        automationEnabled,
      })
      .catch((e) => console.warn('Fee estimate failed:', e))
  }

  const handleLockTokens = useCallback(
    async (values: LockTokensModalFormValues) => {
      const { amount, lockupPeriodInDays, lockupKind, subDao } = values
      if (decimals && symbol) {
        const amountToLock = toBN(amount, decimals)
        const subDaoMint = subDao
          ? subDao.pubkey.equals(IOT_SUB_DAO_KEY)
            ? Mints.IOT
            : Mints.MOBILE
          : undefined

        await createPositionMutation.submit(
          {
            amount: amountToLock.toString(),
            lockupKind: lockupKind.value,
            lockupPeriodsInDays: lockupPeriodInDays,
            mint: mint.toBase58(),
            subDaoMint,
            automationEnabled,
          },
          {
            header: t('gov.transactions.lockTokens'),
            message: t('gov.votingPower.lockYourTokens', {
              amount: humanReadable(amountToLock, decimals),
              symbol,
              duration: getFormattedStringFromDays(lockupPeriodInDays),
            }),
          },
        )

        refetchState()
      }
    },
    [
      createPositionMutation,
      automationEnabled,
      decimals,
      mint,
      refetchState,
      symbol,
      t,
    ],
  )

  const handleClaimRewards = useCallback(async () => {
    if (positionsWithRewards?.length) {
      const positionMints = positionsWithRewards.map((p) => p.mint.toBase58())
      await claimRewardsMutation.submit(
        { positionMints },
        {
          header: t('gov.transactions.claimRewards'),
          message: 'Approve this transaction to claim your rewards',
        },
      )
      refetchState()
      void refetchDelegations()
    }
  }, [
    claimRewardsMutation,
    positionsWithRewards,
    refetchState,
    refetchDelegations,
    t,
  ])

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

  const [prevSubDaos, setPrevSubDaos] = useState<SubDaoWithMeta[]>()
  const [prevDelegatedPositions, setPrevDelegatedPositions] =
    useState<PositionWithMeta[]>()
  if (
    subDaos !== prevSubDaos ||
    delegatedPositions !== prevDelegatedPositions
  ) {
    setPrevSubDaos(subDaos)
    setPrevDelegatedPositions(delegatedPositions)
    const defaultSubDao = getDefaultDelegateAllSubDao(
      subDaos,
      delegatedPositions,
    )
    if (defaultSubDao) setDelegateAllSubDao(defaultSubDao)
  }

  const prepareDelegateAll = useEffectEvent(
    (subDao: SubDaoWithMeta, automation: boolean) => {
      if (!unexpiredPositions?.length) return
      const positionMints = unexpiredPositions.map((p) => p.mint.toBase58())
      const subDaoMint = subDao.pubkey.equals(IOT_SUB_DAO_KEY)
        ? Mints.IOT
        : Mints.MOBILE
      delegateAllMutation
        .prepare({
          positionMints,
          subDaoMint,
          automationEnabled: automation,
        })
        .catch((e) => console.warn('Fee estimate failed:', e))
    },
  )
  useEffect(() => {
    if (isDelegateAllModalOpen && delegateAllSubDao) {
      prepareDelegateAll(delegateAllSubDao, delegateAllAutomationEnabled)
    }
  }, [isDelegateAllModalOpen, delegateAllSubDao, delegateAllAutomationEnabled])

  const handleDelegateAll = useCallback(async () => {
    if (!unexpiredPositions?.length || !delegateAllSubDao) return

    const positionMints = unexpiredPositions.map((p) => p.mint.toBase58())
    const subDaoMint = delegateAllSubDao.pubkey.equals(IOT_SUB_DAO_KEY)
      ? Mints.IOT
      : Mints.MOBILE

    await delegateAllMutation.submit(
      {
        positionMints,
        subDaoMint,
        automationEnabled: delegateAllAutomationEnabled,
      },
      {
        header: t('gov.transactions.delegatePosition'),
        message: t('gov.positions.delegateAllMessage', {
          subdao: delegateAllSubDao.dntMetadata.name,
        }),
      },
    )
    setIsDelegateAllModalOpen(false)
    refetchState()
  }, [
    delegateAllMutation,
    delegateAllSubDao,
    delegateAllAutomationEnabled,
    unexpiredPositions,
    refetchState,
    t,
  ])

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
      disabled: claimRewardsMutation.isPending || loading,
    },
    {
      label: t('gov.positions.delegateAll'),
      value: 'delegate',
      onPress: () => {
        setIsManageSheetOpen(false)
        setIsDelegateAllModalOpen(true)
      },
      disabled: loading || delegateAllMutation.isPending,
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
      onPress: () => {
        setIsManageSheetOpen(false)
        void handleClaimRewards().catch(console.error)
      },
      disabled:
        !positionsWithRewards?.length ||
        claimRewardsMutation.isPending ||
        loading,
      SecondaryIcon: positionsWithRewards?.length ? (
        <Dot filled color="success" size={8} />
      ) : undefined,
    },
  ]

  return (
    <GovernanceWrapper selectedTab="positions">
      <TabSafeArea edges={BOTTOM_EDGE} className="flex-1">
        <View className="flex-1">
          <PositionsList header={<VotingPowerCard className="mb-6" />} />
        </View>
        {showError && (
          <View className="flex-row items-center justify-center pt-3">
            <Text className="font-medium text-destructive">{showError}</Text>
          </View>
        )}
        <View className="flex-row pt-4">
          {HNT_MINT.equals(mint) && (
            <View className="flex-1 flex-row items-center">
              {positions?.length === 0 ? (
                <Button
                  variant="outline"
                  size="dashboard"
                  className="w-full"
                  onPress={() => setIsLockModalOpen(true)}
                >
                  {t('gov.transactions.lockTokens')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="dashboard"
                    className="w-full gap-2"
                    onPress={() => setIsManageSheetOpen(true)}
                    testID="Positions.Manage"
                  >
                    {positionsWithRewards?.length ? (
                      <Dot filled color="success" size={8} />
                    ) : null}
                    <Text
                      className={buttonTextVariants({ variant: 'outline' })}
                    >
                      {t('gov.manage')}
                    </Text>
                  </Button>
                  <BlurActionSheet
                    title={t('gov.manage')}
                    open={isManageSheetOpen}
                    onClose={() => setIsManageSheetOpen(false)}
                  >
                    <View>
                      {manageActions.map((action) => (
                        <ListItem
                          key={action.value}
                          testID={`Positions.Manage.${action.value}`}
                          title={action.label}
                          onPress={action.onPress}
                          disabled={action.disabled}
                          SecondaryIcon={action.SecondaryIcon}
                          hasDivider
                        />
                      ))}
                    </View>
                  </BlurActionSheet>
                </>
              )}
            </View>
          )}
        </View>
        {claimRewardsMutation.isPending && <ClaimingRewardsModal />}
        {isLockModalOpen && (
          <LockTokensModal
            insufficientBalance={isInsufficientSol(
              createPositionMutation.estimatedSolFee,
            )}
            mint={mint}
            maxLockupAmount={maxLockupAmount}
            calcMultiplierFn={handleCalcLockupMultiplier}
            onClose={() => setIsLockModalOpen(false)}
            onSubmit={handleLockTokens}
            onPrepare={handlePrepareCreatePosition}
            automationEnabled={automationEnabled}
            onSetAutomationEnabled={setAutomationEnabled}
            estimatedSolFee={
              createPositionMutation.estimatedSolFee?.uiAmountString
            }
          />
        )}
        {isDelegateAllModalOpen && (
          <DelegateTokensModal
            onClose={() => setIsDelegateAllModalOpen(false)}
            onSubmit={handleDelegateAll}
            onSetAutomationEnabled={setDelegateAllAutomationEnabled}
            automationEnabled={delegateAllAutomationEnabled}
            estimatedSolFee={
              delegateAllMutation.estimatedSolFee?.uiAmountString
            }
            insufficientBalance={isInsufficientSol(
              delegateAllMutation.estimatedSolFee,
            )}
            subDao={delegateAllSubDao}
            setSubDao={setDelegateAllSubDao}
          />
        )}
        {delegateAllMutation.error && (
          <View className="flex-row items-center justify-center pt-3">
            <Text className="font-medium text-destructive">
              {delegateAllMutation.error.message}
            </Text>
          </View>
        )}
      </TabSafeArea>
    </GovernanceWrapper>
  )
}

export default PositionsScreen
