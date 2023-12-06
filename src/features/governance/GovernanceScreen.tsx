import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import globalStyles from '@theme/globalStyles'
import React, { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useGovernance } from '@storage/GovernanceProvider'
import CircleLoader from '@components/CircleLoader'
import { useTranslation } from 'react-i18next'
import { ProposalsList } from './ProposalsList'
import { VotingPowerCard } from './VotingPowerCard'
import { GovernanceNavigationProp } from './governanceTypes'

const GovMints = [HNT_MINT, MOBILE_MINT, IOT_MINT]

export const GovernanceScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const { loading, mint, setMint } = useGovernance()

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
            {GovMints.map((m) => (
              <TokenPill
                key={m.toBase58()}
                mint={m}
                isActive={mint.equals(m)}
                onPress={() => setMint(m)}
                activeColor="secondaryBackground"
              />
            ))}
          </Box>
          {loading && <CircleLoader loaderSize={24} color="white" />}
          {!loading && (
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
