import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { toBN, toNumber } from '@helium/spl-utils'
import {
  calcLockupMultiplier,
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
  const {
    loading,
    mint,
    registrar,
    refetch: refetchState,
    positions,
  } = useGovernance()
  const { info: mintAcc } = useMint(mint)
  const { error, createPosition } = useCreatePosition()
  const { amount: ownedAmount, loading: loadingBal } = useOwnedAmount(
    wallet,
    mint,
  )

  const positionsWithRewards = useMemo(
    () => positions?.filter((p) => p.hasRewards),
    [positions],
  )

  const maxLockupAmount =
    ownedAmount && mintAcc
      ? toNumber(new BN(ownedAmount.toString()), mintAcc.decimals)
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

  const handleLockTokens = async (values: LockTokensModalFormValues) => {
    const { amount, lockupPeriodInDays, lockupKind } = values
    if (mintAcc && walletSignBottomSheetRef) {
      const amountToLock = toBN(amount, mintAcc.decimals)
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: 'Lock tokens',
        serializedTxs: undefined,
      })

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

  return (
    <>
      <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
        <BackScreen
          headerTopMargin="l"
          padding="none"
          title="Your Voting Power"
          edges={backEdges}
        >
          <ScrollView>
            <VotingPowerCard marginTop="l" />
            <PositionsList positions={positions} />
          </ScrollView>
        </BackScreen>
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
            disabled={new BN(ownedAmount?.toString() || 0).eq(new BN(0))}
          />
          <Box paddingHorizontal="s" />
          <ButtonPressable
            flex={1}
            fontSize={16}
            borderRadius="round"
            borderWidth={2}
            borderColor={
              !positionsWithRewards?.length ? 'surfaceSecondary' : 'white'
            }
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.9}
            titleColorDisabled="secondaryText"
            title="Claim Rewards"
            titleColor="black"
            disabled={!positionsWithRewards?.length}
          />
        </Box>
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
