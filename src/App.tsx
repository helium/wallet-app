import AutoGasBanner from '@components/AutoGasBanner'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { OnboardingProvider as HotspotOnboardingProvider } from '@helium/react-native-sdk'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import MapboxGL from '@rnmapbox/maps'
import { ThemeProvider } from '@shopify/restyle'
import { JupiterProvider } from '@storage/JupiterProvider'
import { ModalProvider } from '@storage/ModalsProvider'
import { TokenListProvider } from '@storage/TokenListProvider'
import TokensProvider from '@storage/TokensProvider'
import globalStyles from '@theme/globalStyles'
import { darkThemeColors, lightThemeColors, theme } from '@theme/theme'
import { useColorScheme } from '@theme/themeHooks'
import * as SplashLib from 'expo-splash-screen'
import React, { useMemo } from 'react'
import { LogBox, Platform } from 'react-native'
import useAppState from 'react-native-appstate-hook'
import Config from 'react-native-config'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import OneSignal, { OpenedEvent } from 'react-native-onesignal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import NetworkAwareStatusBar from './components/NetworkAwareStatusBar'
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
import { useNotificationStorage } from './storage/NotificationStorageProvider'
import { BalanceProvider } from './utils/Balance'
import { useDeepLinking } from './utils/linking'

SplashLib.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

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
      OneSignal.setAppId(Config.ONE_SIGNAL_APP_ID)
      OneSignal.setNotificationOpenedHandler((event: OpenedEvent) => {
        setOpenedNotification(event.notification)
      })
      if (Platform.OS === 'ios') {
        OneSignal.promptForPushNotificationsWithUserResponse(() => {})
      }
    }

    // init Mapbox
    if (Config.MAPBOX_ACCESS_TOKEN) {
      MapboxGL.setAccessToken(Config.MAPBOX_ACCESS_TOKEN)
    }
  })

  return (
    <GestureHandlerRootView style={globalStyles.container}>
      <SafeAreaProvider>
        <ThemeProvider theme={colorAdaptedTheme}>
          <PortalProvider>
            <BottomSheetModalProvider>
              <SolanaProvider>
                <SplashScreen>
                  <WalletOnboardingProvider baseUrl={Config.ONBOARDING_API_URL}>
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
                                  <TokenListProvider>
                                    <TokensProvider>
                                      <AutoGasBanner />
                                      <ModalProvider>
                                        <WalletSignProvider>
                                          <JupiterProvider>
                                            <NetworkAwareStatusBar />
                                            <RootNavigator />

                                            {/* place app specific modals here */}
                                            <InsufficientSolConversionModal />
                                          </JupiterProvider>
                                        </WalletSignProvider>
                                      </ModalProvider>
                                    </TokensProvider>
                                  </TokenListProvider>
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
  )
}

export default App
