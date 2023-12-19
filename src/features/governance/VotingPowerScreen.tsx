import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { HNT_MINT, toBN, toNumber } from '@helium/spl-utils'
import {
  calcLockupMultiplier,
  useClaimAllPositionsRewards,
  useCreatePosition,
} from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useGovernance } from '@storage/GovernanceProvider'
import globalStyles from '@theme/globalStyles'
import { daysToSecs } from '@utils/dateTools'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceStackParamList } from './governanceTypes'
import { ClaimingRewardsModal } from './ClaimingRewardsModal'

type Route = RouteProp<GovernanceStackParamList, 'VotingPowerScreen'>

export const VotingPowerScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const wallet = useCurrentWallet()
  const { walletSignBottomSheetRef } = useWalletSign()
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const {
    mint,
    registrar,
    loading,
    refetch: refetchState,
    positions,
    setMint,
  } = useGovernance()
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const { error: createPositionError, createPosition } = useCreatePosition()
  const {
    error: claimingAllRewardsError,
    loading: claimingAllRewards,
    claimAllPositionsRewards,
  } = useClaimAllPositionsRewards()

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

  const getDecision = async (header: string) => {
    let decision

    if (walletSignBottomSheetRef) {
      decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header,
        serializedTxs: undefined,
      })
    }

    return decision
  }

  const handleLockTokens = async (values: LockTokensModalFormValues) => {
    const { amount, lockupPeriodInDays, lockupKind } = values
    if (decimals && walletSignBottomSheetRef) {
      const amountToLock = toBN(amount, decimals)
      const decision = await getDecision(t('gov.transactions.lockTokens'))

      if (decision) {
        await createPosition({
          amount: amountToLock,
          lockupPeriodsInDays: lockupPeriodInDays,
          lockupKind: lockupKind.value,
          mint,
        })

        await refetchState()
      }
    }
  }

  const handleClaimRewards = async () => {
    if (positionsWithRewards && walletSignBottomSheetRef) {
      const decision = await getDecision(t('gov.transactions.claimRewards'))

      if (decision) {
        await claimAllPositionsRewards({ positions: positionsWithRewards })

        if (!claimingAllRewardsError) {
          await refetchState()
        }
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
      {claimingAllRewards && <ClaimingRewardsModal />}
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