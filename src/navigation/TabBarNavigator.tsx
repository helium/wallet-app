import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable'
import { SafeAreaView } from 'react-native-screens/experimental'
import { useCSSVariable } from 'uniwind'
import { Portal } from '@gorhom/portal'
import useEnrichedTransactions from '@hooks/useEnrichedTransactions'
import useHaptic from '@hooks/useHaptic'
import { useGovernance } from '@storage/GovernanceProvider'
import GovernanceNavigator from '../features/governance/GovernanceNavigator'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import SolanaMigration from '../features/migration/SolanaMigration'
import HomeNavigator from '../features/home/HomeNavigator'
import CollectablesNavigator from '../features/collectables/CollectablesNavigator'
import ActivityNavigator from '../features/activity/ActivityNavigator'
import BrowserNavigator from '../features/browser/BrowserNavigator'
import { useAppStore } from '../store/appStore'
import { useSolana } from '../solana/SolanaProvider'
import { ContentColumn } from '../ui/ContentColumn'

const Tab = createNativeBottomTabNavigator()

// Android draws an empty badge as a dot. iOS hides an empty badge, so it
// gets a blank one.
const DOT_BADGE = Platform.select({ ios: ' ', default: '' })

const TabBarNavigator = () => {
  const [active, inactive, tabBar, badge] = useCSSVariable([
    '--color-primary-foreground',
    '--color-muted-foreground',
    '--color-primary',
    '--color-success-500',
  ]).map(String)
  const { triggerImpact } = useHaptic()
  const { hasNewTransactions, resetNewTransactions } = useEnrichedTransactions()
  const { hasUnseenProposals } = useGovernance()
  const setShowBanner = useAppStore((state) => state.setShowBanner)

  const { doneSolanaMigration, manualMigration } = useAppStorage()
  const { cluster, updateCluster } = useSolana()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()

  useEffect(() => {
    setShowBanner(cluster === 'devnet')
  }, [setShowBanner, cluster])

  // Switch to mainnet-beta if migration is complete & user hasn't already migrated
  useEffect(() => {
    if (!currentAccount?.solanaAddress) {
      return
    }

    if (
      !doneSolanaMigration['mainnet-beta']?.includes(
        currentAccount.solanaAddress,
      ) &&
      !manualMigration['mainnet-beta'].includes(currentAccount.solanaAddress)
    ) {
      updateCluster('mainnet-beta')
    }
  }, [
    currentAccount,
    doneSolanaMigration,
    cluster,
    manualMigration,
    updateCluster,
  ])

  // keystone account do not need to migrate
  return (
    <>
      {currentAccount?.solanaAddress &&
        !currentAccount?.keystoneDevice &&
        anchorProvider &&
        !doneSolanaMigration[cluster]?.includes(currentAccount.solanaAddress) &&
        !manualMigration[cluster]?.includes(currentAccount.solanaAddress) && (
          <Portal>
            <SolanaMigration className="absolute inset-0" />
          </Portal>
        )}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          lazy: true,
          tabBarActiveTintColor: active,
          tabBarInactiveTintColor: inactive,
          tabBarStyle: { backgroundColor: tabBar },
          tabBarBadgeStyle: { backgroundColor: badge },
        }}
        // Native tabs draw screens under the tab bar. Pad them clear of it.
        screenLayout={({ children }) => (
          <SafeAreaView edges={{ bottom: true }}>
            <ContentColumn>{children}</ContentColumn>
          </SafeAreaView>
        )}
        screenListeners={({ navigation }) => ({
          tabPress: () => {
            triggerImpact('light')

            // Any tab press while Activity is focused marks its transactions as seen
            const { routes, index } = navigation.getState()
            if (routes[index].name === 'Activity' && hasNewTransactions) {
              resetNewTransactions()
            }
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeNavigator}
          options={{
            tabBarButtonTestID: 'NavBar.account',
            tabBarIcon: {
              type: 'image',
              source: require('@assets/images/tabs/dollar.png'),
            },
          }}
        />
        <Tab.Screen
          name="Collectables"
          component={CollectablesNavigator}
          options={{
            tabBarButtonTestID: 'NavBar.collectables',
            tabBarIcon: {
              type: 'image',
              source: require('@assets/images/tabs/collectableIcon.png'),
            },
          }}
        />
        <Tab.Screen
          name="Activity"
          component={ActivityNavigator}
          options={({ navigation }) => ({
            tabBarButtonTestID: 'NavBar.activity',
            tabBarIcon: {
              type: 'image',
              source: require('@assets/images/tabs/transactions.png'),
            },
            tabBarBadge:
              hasNewTransactions && !navigation.isFocused()
                ? DOT_BADGE
                : undefined,
          })}
        />
        <Tab.Screen
          name="Governance"
          component={GovernanceNavigator}
          options={({ navigation }) => ({
            tabBarButtonTestID: 'NavBar.governance',
            tabBarIcon: {
              type: 'image',
              source: require('@assets/images/tabs/courthouse.png'),
            },
            tabBarBadge:
              hasUnseenProposals && !navigation.isFocused()
                ? DOT_BADGE
                : undefined,
          })}
        />
        <Tab.Screen
          name="Browser"
          component={BrowserNavigator}
          options={{
            tabBarButtonTestID: 'NavBar.browser',
            tabBarIcon: {
              type: 'image',
              source: require('@assets/images/tabs/earth-globe.png'),
            },
          }}
        />
      </Tab.Navigator>
    </>
  )
}

export default TabBarNavigator
