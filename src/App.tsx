import AutoGasBanner from '@components/AutoGasBanner'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { OnboardingProvider as HotspotOnboardingProvider } from '@helium/react-native-sdk'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '@shopify/restyle'
import { ModalProvider } from '@storage/ModalsProvider'
import TokensProvider from '@storage/TokensProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import globalStyles from '@theme/globalStyles'
import { darkTheme } from '@theme/theme'
import * as SplashLib from 'expo-splash-screen'
import React, { useMemo } from 'react'
import { LogBox, Platform, StatusBar, UIManager } from 'react-native'
import useAppState from 'react-native-appstate-hook'
import Config from 'react-native-config'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { OneSignal } from 'react-native-onesignal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import SplashScreen from './components/SplashScreen'
import WalletConnectProvider from './features/dappLogin/WalletConnectProvider'
import LockScreen from './features/lock/LockScreen'
import InsufficientSolConversionModal from './features/modals/InsufficientSolConversionModal'
import WalletOnboardingProvider from './features/onboarding/OnboardingProvider'
import SecurityScreen from './features/security/SecurityScreen'
import useMount from './hooks/useMount'
import { navigationRef } from './navigation/NavigationHelper'
import RootNavigator from './navigation/RootNavigator'
import './polyfill'
import SolanaProvider from './solana/SolanaProvider'
import WalletSignProvider from './solana/WalletSignProvider'
import { useAccountStorage } from './storage/AccountStorageProvider'
import { GovernanceProvider } from './storage/GovernanceProvider'
import { useNotificationStorage } from './storage/NotificationStorageProvider'
import { BalanceProvider } from './utils/Balance'
import { useDeepLinking } from './utils/linking'

SplashLib.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

const App = () => {
  // Note that the Android SDK is slightly peculiar
  // in that it requires setting an access token,
  // even though it will be null for most users(only Mapbox authenticates this way)
  MapLibreGL.setAccessToken(null)

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
  ])

  const { appState } = useAppState()
  const { restored: accountsRestored } = useAccountStorage()
  const { setOpenedNotification } = useNotificationStorage()

  const linking = useDeepLinking()

  const themeObject = useMemo(() => {
    return darkTheme
  }, [])

  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
  }
  const colorAdaptedTheme = useMemo(
    () => ({
      ...themeObject,
    }),
    [themeObject],
  )

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      dark: true,
      colors: {
        ...DarkTheme.colors,
        background: themeObject.colors.primaryBackground,
      },
    }),
    [themeObject],
  )

  useMount(() => {
    // init OneSignal
    if (Config.ONE_SIGNAL_APP_ID) {
      OneSignal.initialize(Config.ONE_SIGNAL_APP_ID)
      OneSignal.Notifications.addEventListener('click', (event) => {
        setOpenedNotification(event.notification)
      })
      OneSignal.Notifications.requestPermission(true)
    }
  })

  const queryClient = React.useMemo(() => new QueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={globalStyles.container}>
        <StatusBar
          backgroundColor={themeObject.colors.primaryBackground}
          barStyle="light-content"
        />
        <SafeAreaProvider>
          <ThemeProvider theme={colorAdaptedTheme}>
            <PortalProvider>
              <BottomSheetModalProvider>
                <SolanaProvider>
                  <SplashScreen>
                    <WalletOnboardingProvider
                      baseUrl={Config.ONBOARDING_API_URL}
                    >
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
                                          <GovernanceProvider>
                                            <AutoGasBanner />
                                            <RootNavigator />

                                            {/* place app specific modals here */}
                                            <InsufficientSolConversionModal />
                                          </GovernanceProvider>
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
