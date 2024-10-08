/* eslint-disable @typescript-eslint/no-shadow */
import Flag from '@assets/images/flag.svg'
import LightningBolt from '@assets/images/lightningBolt.svg'
import UserStar from '@assets/images/userStar.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import { Select } from '@components/Select'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'
import { useSetTab } from './useSetTab'
import { NetworkTabs } from './NetworkTabs'
import { FadeIn } from 'react-native-reanimated'
import { useColors } from '@theme/themeHooks'

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
  const { loading, hasUnseenProposals } = useGovernance()
  const anim = useRef(new Animated.Value(1))
  const setSelectedTab = useSetTab()
  const colors = useColors()

  const icons: { [key: string]: React.ReactElement } = useMemo(
    () => ({
      proposals: <Flag width={16} height={16} color={colors.primaryText} />,
      voters: (
        <LightningBolt width={16} height={16} color={colors.primaryText} />
      ),
      positions: <UserStar width={16} height={16} color={colors.primaryText} />,
    }),
    [colors],
  )

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
    <ReAnimatedBox entering={FadeIn} paddingHorizontal={'5'}>
      <Box flex={1}>
        <Box flexDirection="column" height="100%">
          <Box mt="6" mb="6">
            <NetworkTabs />
          </Box>
          {loading ? (
            <Box mt="12" flexDirection="column" flex={1}>
              <CircleLoader loaderSize={24} color="primaryText" />
            </Box>
          ) : (
            <Box mt="4" flexDirection="column" flex={1}>
              {header}
              <Select
                mb="8"
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
      </Box>
    </ReAnimatedBox>
  )
}

export default GovernanceWrapper
