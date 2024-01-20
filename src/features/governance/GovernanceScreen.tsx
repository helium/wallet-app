/* eslint-disable @typescript-eslint/no-shadow */
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import globalStyles from '@theme/globalStyles'
import React, { useEffect, useMemo, useRef } from 'react'
import { ScrollView, Animated } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useGovernance } from '@storage/GovernanceProvider'
import CircleLoader from '@components/CircleLoader'
import { useTranslation } from 'react-i18next'
import { GovMints } from '@utils/constants'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { ProposalsList } from './ProposalsList'
import { VotingPowerCard } from './VotingPowerCard'
import {
  GovernanceStackParamList,
  GovernanceNavigationProp,
} from './governanceTypes'

type Route = RouteProp<GovernanceStackParamList, 'GovernanceScreen'>
export const GovernanceScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const { currentAccount } = useAccountStorage()
  const { loading, mint, setMint, proposalCountByMint, hasUnseenProposals } =
    useGovernance()
  const anim = useRef(new Animated.Value(1))

  useEffect(() => {
    // if we have a mint and proposal, navigate to the proposal screen
    // this is used for deep linking and to maintain
    // GovernanceScreen as the back button
    if (route.params?.mint && route.params?.proposal) {
      navigation.navigate('ProposalScreen', {
        mint: route.params.mint,
        proposal: route.params.proposal,
      })
    }
  }, [route, navigation])

  useEffect(() => {
    if (!loading && hasUnseenProposals) {
      const res = Animated.loop(
        // runs given animations in a sequence
        Animated.sequence([
          // increase size
          Animated.timing(anim.current, {
            toValue: 1.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          // decrease size
          Animated.timing(anim.current, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      )

      // start the animation
      res.start()

      return () => {
        // stop animation
        res.reset()
      }
    }
  }, [loading, hasUnseenProposals])

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
            paddingHorizontal="m"
          >
            {GovMints.map((m) => {
              const pk = new PublicKey(m)
              const hasUnseenProposals =
                (proposalCountByMint?.[m] || 0) >
                (currentAccount?.proposalCountByMint?.[m] || 0)

              return (
                <Box key={m} position="relative">
                  <TokenPill
                    mint={pk}
                    isActive={mint.equals(pk)}
                    onPress={() => setMint(pk)}
                    inactiveColor="secondaryBackground"
                    activeColor="secondary"
                  />
                  {!mint.equals(pk) && hasUnseenProposals && (
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      marginRight="s"
                      position="absolute"
                      top={-4}
                      right={4}
                    >
                      <Box>
                        <Box
                          zIndex={2}
                          width={12}
                          height={12}
                          backgroundColor="flamenco"
                          borderRadius="round"
                        />
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                        >
                          <Animated.View
                            style={{ transform: [{ scale: anim.current }] }}
                          >
                            <Box
                              opacity={0.3}
                              borderRadius="round"
                              width="100%"
                              height="100%"
                              backgroundColor="flamenco"
                            />
                          </Animated.View>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
          {loading ? (
            <CircleLoader loaderSize={24} color="white" />
          ) : (
            <Box paddingHorizontal="m">
              <VotingPowerCard
                onPress={async (m) =>
                  navigation.push('VotingPowerScreen', {
                    mint: m.toBase58(),
                  })
                }
              />
              {/*               {numActiveVotes > 0 && (
                <TouchableOpacityBox onPress={() => {}}>
                  <Box
                    flexDirection="row"
                    backgroundColor="secondaryBackground"
                    justifyContent="space-between"
                    alignItems="center"
                    borderRadius="l"
                    padding="m"
                    marginTop="m"
                  >
                    <Box flexDirection="row">
                      <Text
                        variant="body2"
                        color="secondaryText"
                        marginRight="xs"
                      >
                        Relinquish Active Votes:
                      </Text>
                      <Text variant="body2" color="secondaryText">
                        {numActiveVotes}
                      </Text>
                    </Box>
                    <Text variant="body2" color="white" marginRight="xs">
                      &gt;
                    </Text>
                  </Box>
                </TouchableOpacityBox>
              )} */}
              <ProposalsList />
            </Box>
          )}
        </ScrollView>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default GovernanceScreen
