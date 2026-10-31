import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import React, { useEffect, useMemo } from 'react'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { Flag, UserStar, Zap } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import {
  GovernanceNavigationProp,
  GovernanceStackParamList,
} from './governanceTypes'
import { Select } from './Select'
import { useSetTab } from './useSetTab'

const SafeArea = withUniwind(SafeAreaView)
const FlagIcon = withUniwind(Flag)
const UserStarIcon = withUniwind(UserStar)
const ZapIcon = withUniwind(Zap)

const icons: { [key: string]: React.ReactElement } = {
  proposals: <FlagIcon size={16} colorClassName="accent-foreground" />,
  proxies: <UserStarIcon size={16} colorClassName="accent-foreground" />,
  positions: <ZapIcon size={16} colorClassName="accent-foreground" />,
}

type Route = RouteProp<GovernanceStackParamList, 'ProposalsScreen'>
export const GovernanceWrapper: React.FC<
  React.PropsWithChildren<{
    selectedTab: 'proposals' | 'proxies' | 'positions'
    header?: React.ReactElement
  }>
> = ({ selectedTab, children, header }) => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const safeEdges = useMemo(() => ['top'] as Edge[], [])
  const { loading } = useGovernance()
  const setSelectedTab = useSetTab()

  useEffect(() => {
    // if we have a mint and proposal, navigate to the proposal screen
    // this is used for deep linking and to maintain
    // ProposalsScreen as the back button
    if (route.params?.mint && route.params?.proposal) {
      navigation.navigate(
        'ProposalsScreen',
        { mint: route.params.mint, proposal: route.params.proposal },
        { pop: true },
      )
    }
  }, [route, navigation])

  // The tab select and the proposal filter sheets portal to the nearest
  // BottomSheetModalProvider. This one keeps them inside the screen.
  return (
    <BottomSheetModalProvider>
      <SafeArea edges={safeEdges} className="flex-1 bg-background">
        <View className="h-full flex-col">
          <Text size="xl" className="mt-4 self-center font-semibold">
            {t('gov.title')}
          </Text>
          {loading ? (
            <View className="mt-12 flex-1 flex-col px-4">
              <Spinner />
            </View>
          ) : (
            <View className="mt-12 flex-1 flex-col px-4">
              {header}
              <Select
                testID="Governance.TabSelect"
                title=""
                className="mb-8"
                value={selectedTab}
                onValueChange={setSelectedTab}
                options={['proposals', 'proxies', 'positions'].map((o) => ({
                  label: o.charAt(0).toUpperCase() + o.slice(1),
                  value: o,
                  icon: icons[o],
                }))}
              />

              {children}
            </View>
          )}
        </View>
      </SafeArea>
    </BottomSheetModalProvider>
  )
}

export default GovernanceWrapper
