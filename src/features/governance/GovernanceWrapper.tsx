/* eslint-disable @typescript-eslint/no-shadow */
import Flag from '@assets/images/flag.svg'
import LightningBolt from '@assets/images/lightningBolt.svg'
import UserStar from '@assets/images/userStar.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import SafeAreaBox from '@components/SafeAreaBox'
import { Select } from '@components/Select'
import Text from '@components/Text'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import globalStyles from '@theme/globalStyles'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'
import { useSetTab } from './useSetTab'
import { NetworkTabs } from './NetworkTabs'

const icons: { [key: string]: React.ReactElement } = {
  proposals: <Flag width={16} height={16} color="white" />,
  voters: <LightningBolt width={16} height={16} color="white" />,
  positions: <UserStar width={16} height={16} color="white" />,
}

type Route = RouteProp<GovernanceStackParamList, 'ProposalsScreen'>
export const GovernanceWrapper: React.FC<
  React.PropsWithChildren<{
    selectedTab: 'proposals' | 'voters' | 'positions'
    header?: React.ReactElement
  }>
> = ({ selectedTab, children, header }) => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const { loading, hasUnseenProposals } = useGovernance()
  const anim = useRef(new Animated.Value(1))
  const setSelectedTab = useSetTab()

  useEffect(() => {
    // if we have a mint and proposal, navigate to the proposal screen
    // this is used for deep linking and to maintain
    // ProposalsScreen as the back button
    if (route.params?.mint && route.params?.proposal) {
      navigation.navigate('ProposalsScreen', {
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
    <ReAnimatedBox style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <Box flexDirection="column" height="100%">
          <Text marginTop="m" alignSelf="center" variant="h4">
            {t('gov.title')}
          </Text>
          <Box mt="xl" mb="l">
            <NetworkTabs />
          </Box>
          {loading ? (
            <Box paddingHorizontal="m" mt="xxl" flexDirection="column" flex={1}>
              <CircleLoader loaderSize={24} color="white" />
            </Box>
          ) : (
            <Box paddingHorizontal="m" mt="xxl" flexDirection="column" flex={1}>
              {header}
              <Select
                mb="xl"
                value={selectedTab}
                onValueChange={setSelectedTab}
                options={['proposals', 'voters', 'positions'].map((o) => ({
                  label: o.charAt(0).toUpperCase() + o.slice(1),
                  value: o,
                  icon: icons[o],
                }))}
              />

              {children}
            </Box>
          )}
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default GovernanceWrapper
