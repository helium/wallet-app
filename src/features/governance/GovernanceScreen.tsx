import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { useNavigation } from '@react-navigation/native'
import globalStyles from '@theme/globalStyles'
import React, { useEffect, useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useGovernance } from '@storage/GovernanceProvider'
import CircleLoader from '@components/CircleLoader'
import { useTranslation } from 'react-i18next'
import { GovMints } from '@utils/constants'
import { PublicKeyMismatchError } from '@metaplex-foundation/mpl-bubblegum'
import { PublicKey } from '@solana/web3.js'
import { ProposalsList } from './ProposalsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceNavigationProp } from './governanceTypes'

export const GovernanceScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const { loading, mint, setMint, refetch } = useGovernance()

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refetch()
    })
  }, [navigation, refetch])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <ScrollView>
          <Text marginTop="m" alignSelf="center" variant="h4">
            {t('gov.title')}
          </Text>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginVertical="xl"
          >
            {GovMints.map((m) => {
              const pk = new PublicKey(m)

              return (
                <TokenPill
                  key={m}
                  mint={pk}
                  isActive={mint.equals(pk)}
                  onPress={() => setMint(pk)}
                  activeColor="secondaryBackground"
                />
              )
            })}
          </Box>
          {loading ? (
            <CircleLoader loaderSize={24} color="white" />
          ) : (
            <>
              <VotingPowerCard
                onPress={async (m) =>
                  navigation.push('VotingPowerScreen', {
                    mint: m.toBase58(),
                  })
                }
              />
              <ProposalsList />
            </>
          )}
        </ScrollView>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default GovernanceScreen
