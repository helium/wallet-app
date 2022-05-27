import './polyfill'
import React, { useEffect, useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { Text, LogBox, Platform, UIManager } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import useAppState from 'react-native-appstate-hook'
import * as SplashScreen from 'expo-splash-screen'
import OneSignal, { OpenedEvent } from 'react-native-onesignal'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Logger from './utils/logger'
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
import SafeAreaBox from './components/SafeAreaBox'
import { BalanceProvider } from './utils/Balance'
import { useColorScheme } from './theme/themeHooks'
import { linking } from './utils/linking'
import { useNotificationStorage } from './storage/NotificationStorageProvider'
import CustomStatusBar from './components/TestnetAwareStatusBar'
import WalletConnectProvider from './features/dappLogin/WalletConnectProvider'
import { navigationRef } from './navigation/NavigationHelper'

SplashScreen.preventAutoHideAsync().catch(() => {
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

  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
  }

  const { appState } = useAppState()
  const { restored: accountsRestored } = useAccountStorage()
  const { setOpenedNotification } = useNotificationStorage()

  const { client, loading } = useApolloClient()

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
    OneSignal.setAppId(Config.ONE_SIGNAL_APP_ID)
    OneSignal.setNotificationOpenedHandler((event: OpenedEvent) => {
      setOpenedNotification(event.notification)
    })
    if (Platform.OS === 'ios') {
      OneSignal.promptForPushNotificationsWithUserResponse(() => {})
    }

    // init Sentry
    Logger.init()
  })

  useEffect(() => {
    if (!accountsRestored) return

    SplashScreen.hideAsync()
  }, [accountsRestored])

  if (!client || loading) {
    return (
      <ThemeProvider theme={colorAdaptedTheme}>
        <SafeAreaBox flex={1} backgroundColor="white">
          <Text>Splash Screen</Text>
        </SafeAreaBox>
      </ThemeProvider>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider theme={colorAdaptedTheme}>
          <OnboardingProvider>
            <CustomStatusBar />
            <ApolloProvider client={client}>
              <BalanceProvider>
                <TransactionProvider>
                  <LockScreen>
                    <WalletConnectProvider>
                      {accountsRestored && (
                        <AccountSelector>
                          <NavigationContainer
                            theme={navTheme}
                            linking={linking}
                            ref={navigationRef}
                          >
                            <RootNavigator />
                          </NavigationContainer>
                          <SecurityScreen
                            visible={
                              appState !== 'active' && appState !== 'unknown'
                            }
                          />
                        </AccountSelector>
                      )}
                    </WalletConnectProvider>
                  </LockScreen>
                </TransactionProvider>
              </BalanceProvider>
            </ApolloProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
