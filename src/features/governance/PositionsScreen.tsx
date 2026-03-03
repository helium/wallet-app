import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Dot from '@components/Dot'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import type { TokenAmountOutput } from '@helium/blockchain-api'
import { useOwnedAmount, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { HNT_MINT, humanReadable, toBN, toNumber } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'
import {
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
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY, Mints } from '@utils/constants'
import { daysToSecs, getFormattedStringFromDays } from '@utils/dateTools'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

  const positionsWithRewards = useMemo(
    () => positions?.filter((p) => p.hasRewards),
    [positions],
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

  const handlePrepareCreatePosition = useCallback(
    (values: LockTokensModalFormValues) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createPositionMutation.prepare, automationEnabled, decimals, mint],
  )

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
    }
  }, [claimRewardsMutation, positionsWithRewards, refetchState, t])

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
    if (!subDaos || !delegatedPositions) return
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
  }, [subDaos, delegatedPositions])

  useEffect(() => {
    if (
      isDelegateAllModalOpen &&
      delegateAllSubDao &&
      unexpiredPositions?.length
    ) {
      const positionMints = unexpiredPositions.map((p) => p.mint.toBase58())
      const subDaoMint = delegateAllSubDao.pubkey.equals(IOT_SUB_DAO_KEY)
        ? Mints.IOT
        : Mints.MOBILE
      delegateAllMutation
        .prepare({
          positionMints,
          subDaoMint,
          automationEnabled: delegateAllAutomationEnabled,
        })
        .catch((e) => console.warn('Fee estimate failed:', e))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      onPress: async () => {
        setIsManageSheetOpen(false)
        await handleClaimRewards()
      },
      disabled:
        !positionsWithRewards?.length ||
        claimRewardsMutation.isPending ||
        loading,
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
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            paddingTop="ms"
          >
            <Text variant="body3Medium" color="red500">
              {delegateAllMutation.error.message}
            </Text>
          </Box>
        )}
      </Box>
    </GovernanceWrapper>
  )
}

export default PositionsScreen
