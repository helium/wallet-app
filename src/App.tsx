import './polyfill'
import React, { useMemo } from 'react'
import { LogBox, Platform } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import useAppState from 'react-native-appstate-hook'
import OneSignal, { OpenedEvent } from 'react-native-onesignal'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import * as SplashLib from 'expo-splash-screen'
import { AccountProvider } from '@helium/helium-react-hooks'
import { theme, darkThemeColors, lightThemeColors } from '@theme/theme'
import { useColorScheme } from '@theme/themeHooks'
import globalStyles from '@theme/globalStyles'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import useMount from './hooks/useMount'
import RootNavigator from './navigation/RootNavigator'
import { useAccountStorage } from './storage/AccountStorageProvider'
import LockScreen from './features/lock/LockScreen'
import SecurityScreen from './features/security/SecurityScreen'
import OnboardingProvider from './features/onboarding/OnboardingProvider'
import { BalanceProvider } from './utils/Balance'
import { useDeepLinking } from './utils/linking'
import { useNotificationStorage } from './storage/NotificationStorageProvider'
import NetworkAwareStatusBar from './components/NetworkAwareStatusBar'
import WalletConnectProvider from './features/dappLogin/WalletConnectProvider'
import { navigationRef } from './navigation/NavigationHelper'
import SplashScreen from './components/SplashScreen'
import { useSolana } from './solana/SolanaProvider'
import WalletSignProvider from './solana/WalletSignProvider'

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
  const { connection } = useSolana()
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
  })

  return (
    <GestureHandlerRootView style={globalStyles.container}>
      <SafeAreaProvider>
        <ThemeProvider theme={colorAdaptedTheme}>
          <SplashScreen>
            <PortalProvider>
              <BottomSheetModalProvider>
                <PortalHost name="browser-portal" />
                <OnboardingProvider baseUrl={Config.ONBOARDING_API_URL}>
                  {connection && (
                    <LockScreen>
                      <AccountProvider
                        extendConnection={false}
                        commitment="confirmed"
                        connection={connection}
                      >
                        <WalletConnectProvider>
                          {accountsRestored && (
                            <>
                              <NavigationContainer
                                theme={navTheme}
                                linking={linking}
                                ref={navigationRef}
                              >
                                <BalanceProvider>
                                  <WalletSignProvider>
                                    <NetworkAwareStatusBar />
                                    <RootNavigator />
                                  </WalletSignProvider>
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
                        </WalletConnectProvider>
                      </AccountProvider>
                    </LockScreen>
                  )}
                </OnboardingProvider>
              </BottomSheetModalProvider>
            </PortalProvider>
          </SplashScreen>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
