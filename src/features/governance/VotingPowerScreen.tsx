import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { toBN, toNumber } from '@helium/spl-utils'
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
import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'

export const VotingPowerScreen = () => {
  const wallet = useCurrentWallet()
  const { walletSignBottomSheetRef } = useWalletSign()
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const { mint, registrar, refetch: refetchState, positions } = useGovernance()
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const { error: createPositionError, createPosition } = useCreatePosition()
  const {
    error: claimingAllRewardsError,
    loading: claimingAllRewards,
    claimAllPositionsRewards,
  } = useClaimAllPositionsRewards()

  const positionsWithRewards = useMemo(
    () => positions?.filter((p) => p.hasRewards),
    [positions],
  )

  const transactionError = useMemo(() => {
    if (createPositionError) {
      return createPositionError.message || 'Lock failed. please try again.'
    }

    if (claimingAllRewardsError) {
      return (
        claimingAllRewardsError.message || 'Claim failed, please try again.'
      )
    }

    return undefined
  }, [createPositionError, claimingAllRewardsError])

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
      const decision = await getDecision('Lock tokens')

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
      const decision = await getDecision('Claim rewards')

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
          title="Your Voting Power"
          edges={backEdges}
        >
          <Box flex={1}>
            <ScrollView>
              <VotingPowerCard marginTop="l" />
              <PositionsList positions={positions} />
            </ScrollView>
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
          <Box flexDirection="row" padding="m">
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="round"
              borderWidth={2}
              borderColor="white"
              backgroundColorOpacityPressed={0.7}
              title="Lock Tokens"
              titleColor="white"
              titleColorPressed="black"
              onPress={() => setIsLockModalOpen(true)}
              disabled={claimingAllRewards}
            />
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
              title={claimingAllRewards ? '' : 'Claim Rewards'}
              titleColor="black"
              onPress={handleClaimRewards}
              disabled={!positionsWithRewards?.length || claimingAllRewards}
              TrailingComponent={
                claimingAllRewards ? <CircleLoader color="white" /> : undefined
              }
            />
          </Box>
        </BackScreen>
      </ReAnimatedBox>
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
