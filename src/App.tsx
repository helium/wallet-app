import './polyfill'
import React, { useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { LogBox, Platform } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import useAppState from 'react-native-appstate-hook'
import OneSignal, { OpenedEvent } from 'react-native-onesignal'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { PortalProvider } from '@gorhom/portal'
import * as SplashLib from 'expo-splash-screen'
import { useApolloClient } from './graphql/useApolloClient'
import { theme, darkThemeColors, lightThemeColors } from './theme/theme'
import RootNavigator from './navigation/RootNavigator'
import { useAccountStorage } from './storage/AccountStorageProvider'
import LockScreen from './features/lock/LockScreen'
import SecurityScreen from './features/security/SecurityScreen'
import useMount from './utils/useMount'
import OnboardingProvider from './features/onboarding/OnboardingProvider'
import AccountSelector from './components/AccountSelector'
import TransactionProvider from './storage/TransactionProvider'
import { BalanceProvider } from './utils/Balance'
import { useColorScheme } from './theme/themeHooks'
import { linking } from './utils/linking'
import { useNotificationStorage } from './storage/NotificationStorageProvider'
import TestnetAwareStatusBar from './components/TestnetAwareStatusBar'
import WalletConnectProvider from './features/dappLogin/WalletConnectProvider'
import { navigationRef } from './navigation/NavigationHelper'
import globalStyles from './theme/globalStyles'
import SplashScreen from './components/SplashScreen'

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
  ])

  const { appState } = useAppState()
  const { restored: accountsRestored } = useAccountStorage()
  const { setOpenedNotification } = useNotificationStorage()

  const { client } = useApolloClient()

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
              <OnboardingProvider>
                {client && (
                  <ApolloProvider client={client}>
                    <BalanceProvider>
                      <TransactionProvider>
                        <LockScreen>
                          <WalletConnectProvider>
                            {accountsRestored && (
                              <AccountSelector>
                                <NavigationContainer
                                  theme={navTheme}
                                  // Can't figure out how to fix this ts error
                                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                  // @ts-ignore
                                  linking={linking}
                                  ref={navigationRef}
                                >
                                  <TestnetAwareStatusBar />
                                  <RootNavigator />
                                </NavigationContainer>
                                <SecurityScreen
                                  visible={
                                    appState !== 'active' &&
                                    appState !== 'unknown'
                                  }
                                />
                              </AccountSelector>
                            )}
                          </WalletConnectProvider>
                        </LockScreen>
                      </TransactionProvider>
                    </BalanceProvider>
                  </ApolloProvider>
                )}
              </OnboardingProvider>
            </PortalProvider>
          </SplashScreen>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
