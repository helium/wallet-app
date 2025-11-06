import AutoGasBanner from '@components/AutoGasBanner'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { OnboardingProvider as HotspotOnboardingProvider } from '@helium/react-native-sdk'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '@shopify/restyle'
import { JupiterProvider } from '@storage/JupiterProvider'
import { ModalProvider } from '@storage/ModalsProvider'
import TokensProvider from '@storage/TokensProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import globalStyles from '@theme/globalStyles'
import { darkThemeColors, lightThemeColors, theme } from '@theme/theme'
import { useColorScheme } from '@theme/themeHooks'
import * as SplashLib from 'expo-splash-screen'
import React, { useMemo, useState, useEffect } from 'react'
import { LogBox } from 'react-native'
import useAppState from 'react-native-appstate-hook'
import Config from 'react-native-config'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { OneSignal } from 'react-native-onesignal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import NetworkAwareStatusBar from './components/NetworkAwareStatusBar'
import SplashScreen from './components/SplashScreen'
import WalletConnectProvider from './features/dappLogin/WalletConnectProvider'
import KeystoneOnboardingProvider from './features/keystone/KeystoneOnboardingProvider'
import LockScreen from './features/lock/LockScreen'
import DeprecatedTokensCheck from './features/modals/DeprecatedTokensCheck'
import DeprecatedTokensModal from './features/modals/DeprecatedTokensModal'
import InsufficientSolConversionModal from './features/modals/InsufficientSolConversionModal'
import { DeprecatedTokensProvider } from './storage/DeprecatedTokensProvider'
import WalletOnboardingProvider from './features/onboarding/OnboardingProvider'
import SecurityScreen from './features/security/SecurityScreen'
import useMount from './hooks/useMount'
import { navigationRef } from './navigation/NavigationHelper'
import RootNavigator from './navigation/RootNavigator'
import './polyfill'
import SolanaProvider from './solana/SolanaProvider'
import WalletSignProvider from './solana/WalletSignProvider'
import { useAccountStorage } from './storage/AccountStorageProvider'
import { useAppStorage } from './storage/AppStorageProvider'
import { GovernanceProvider } from './storage/GovernanceProvider'
import { useNotificationStorage } from './storage/NotificationStorageProvider'
import { BalanceProvider } from './utils/Balance'
import { useDeepLinking } from './utils/linking'

SplashLib.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

// Wrapper to defer heavy data fetching to prevent OOM on Face ID unlock
const DeferredDataFetchWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [shouldFetchDeprecated, setShouldFetchDeprecated] = useState(false)
  const { locked } = useAppStorage()

  useEffect(() => {
    if (!locked) {
      // Delay deprecated tokens fetch by 5 seconds after unlock
      // This spreads out memory load from all the simultaneous provider fetches
      const timer = setTimeout(() => {
        setShouldFetchDeprecated(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [locked])

  return (
    <GovernanceProvider enabled={!locked}>
      <DeprecatedTokensProvider enabled={shouldFetchDeprecated && !locked}>
        {children}
      </DeprecatedTokensProvider>
    </GovernanceProvider>
  )
}

const App = () => {
  LogBox.ignoreLogs([
    'Module iCloudStorage',
    'EventEmitter.removeListener',
    'componentWillReceiveProps has been renamed',
    'AsyncStorage has been extracted from react-native core and will be removed in a future release.',
    'You are calling concat on a terminating link, which will have no effect',
    "[react-native-gesture-handler] Seems like you're using an old API with gesture components",
    'console.error: {"context":"client"} {"context":"client/pairing"} Unauthorized pairing update request',
    'Require cycle:',
    'ws error: received bad response code from server 403',
    'ImmutableStateInvariantMiddleware',
    'ws error: received bad response code from server 429',
    'Ignored unsubscribe request because an active subscription with id',
    'accountFetchCache Batching account fetch of',
    "ws error: The operation couldn't be completed. Connection reset by peer",
    'You have tried to read "wallet" on a WalletContext without providing one. Make sure to render a WalletProvider as an ancestor of the component that uses WalletContext',
  ])

  const { appState } = useAppState()
  const { restored: accountsRestored } = useAccountStorage()
  // const { cache } = useSolana()
  const { setOpenedNotification } = useNotificationStorage()

  const linking = useDeepLinking()

  const colorScheme = useColorScheme()
  const colorAdaptedTheme = useMemo(
    () => ({
      ...theme,
      colors: colorScheme === 'light' ? lightThemeColors : darkThemeColors,
    }),
    [colorScheme],
  )

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      dark: colorScheme === 'light',
      colors: {
        ...DarkTheme.colors,
        background:
          colorScheme === 'light'
            ? lightThemeColors.primaryBackground
            : darkThemeColors.primaryBackground,
      },
    }),

    [colorScheme],
  )

  useMount(() => {
    // init OneSignal
    if (Config.ONE_SIGNAL_APP_ID) {
      try {
        OneSignal.initialize(Config.ONE_SIGNAL_APP_ID)
        OneSignal.Notifications.addEventListener('click', (event) => {
          setOpenedNotification(event.notification)
        })
        OneSignal.Notifications.requestPermission(true)
      } catch (error) {
        console.error('OneSignal initialization error:', error)
      }
    }
  })

  const queryClient = React.useMemo(() => new QueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={globalStyles.container}>
        <SafeAreaProvider>
          <ThemeProvider theme={colorAdaptedTheme}>
            <PortalProvider>
              <BottomSheetModalProvider>
                <SolanaProvider>
                  <SplashScreen>
                    <WalletOnboardingProvider
                      baseUrl={Config.ONBOARDING_API_URL}
                    >
                      <KeystoneOnboardingProvider>
                        <WalletConnectProvider>
                          <HotspotOnboardingProvider
                            baseUrl={Config.ONBOARDING_API_URL}
                          >
                            <LockScreen>
                              {accountsRestored && (
                                <>
                                  <NavigationContainer
                                    theme={navTheme}
                                    linking={linking}
                                    ref={navigationRef}
                                  >
                                    <BalanceProvider>
                                      <TokensProvider>
                                        <ModalProvider>
                                          <WalletSignProvider>
                                            <DeferredDataFetchWrapper>
                                              <AutoGasBanner />
                                              <NetworkAwareStatusBar />
                                              <RootNavigator />

                                              {/* place app specific modals here */}
                                              <InsufficientSolConversionModal />
                                              <JupiterProvider>
                                                <DeprecatedTokensModal />
                                                <DeprecatedTokensCheck />
                                              </JupiterProvider>
                                            </DeferredDataFetchWrapper>
                                          </WalletSignProvider>
                                        </ModalProvider>
                                      </TokensProvider>
                                    </BalanceProvider>
                                  </NavigationContainer>
                                  <SecurityScreen
                                    visible={
                                      appState !== 'active' &&
                                      appState !== 'unknown'
                                    }
                                  />
                                </>
                              )}
                            </LockScreen>
                          </HotspotOnboardingProvider>
                        </WalletConnectProvider>
                      </KeystoneOnboardingProvider>
                    </WalletOnboardingProvider>
                  </SplashScreen>
                </SolanaProvider>
              </BottomSheetModalProvider>
            </PortalProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  )
}

export default App
