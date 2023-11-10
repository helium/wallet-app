import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import globalStyles from '@theme/globalStyles'
import React, { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useGovernance } from '@storage/GovernanceProvider'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import BN from 'bn.js'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { toNumber } from '@helium/spl-utils'
import { PositionsList } from './PositionsList'
import { VotingPowerCard } from './VotingPowerCard'
import LockTokensModal from './LockTokensModal'

export const VotingPowerScreen = () => {
  const wallet = useCurrentWallet()
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const { mint } = useGovernance()
  const { amount: ownedAmount, decimals } = useOwnedAmount(wallet, mint)
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const { positions } = useGovernance()

  const maxLockupAmount =
    ownedAmount && decimals
      ? toNumber(new BN(ownedAmount.toString()), decimals)
      : 0

  // TODO - implement
  const handleLockTokens = async () => {
    setIsLockModalOpen(false)
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
            height={50}
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
            height={50}
            flex={1}
            fontSize={16}
            borderRadius="round"
            borderWidth={2}
            borderColor="white"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            title="Claim Rewards"
            titleColor="black"
          />
        </Box>
      </ReAnimatedBox>
      {isLockModalOpen && (
        <LockTokensModal
          mint={mint}
          maxLockupAmount={maxLockupAmount}
          calcMultiplierFn={(x) => x * 2}
          onClose={() => setIsLockModalOpen(false)}
          onSubmit={handleLockTokens}
        />
      )}
    </>
  )
}

export default VotingPowerScreen
