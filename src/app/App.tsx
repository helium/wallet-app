import AutoGasBanner from '@components/AutoGasBanner'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { OnboardingProvider as HotspotOnboardingProvider } from '@helium/react-native-sdk'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '@shopify/restyle'
import { ModalProvider } from '@config/storage/ModalsProvider'
import TokensProvider from '@config/storage/TokensProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import globalStyles from '@config/theme/globalStyles'
import { darkTheme } from '@config/theme/theme'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Mapbox from '@rnmapbox/maps'
import { LogBox, Platform, StatusBar, UIManager } from 'react-native'
import Config from 'react-native-config'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { OneSignal } from 'react-native-onesignal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import SolanaProvider from '@features/solana/SolanaProvider'
import WalletSignProvider from '@features/solana/WalletSignProvider'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { GovernanceProvider } from '@config/storage/GovernanceProvider'
import { useNotificationStorage } from '@config/storage/NotificationStorageProvider'
import { BalanceProvider } from '@utils/Balance'
import { useDeepLinking } from '@utils/linking'
import KeystoneOnboardingProvider from '@features/keystone/KeystoneOnboardingProvider'
import BootSplash from 'react-native-bootsplash'
import WalletConnectProvider from '../features/dappLogin/WalletConnectProvider'
import LockScreen from '../features/lock/LockScreen'
import InsufficientSolConversionModal from '../features/modals/InsufficientSolConversionModal'
import WalletOnboardingProvider from '../features/onboarding/OnboardingProvider'
import useMount from '../hooks/useMount'
import { navigationRef } from './NavigationHelper'
import RootNavigator from './RootNavigator'
import '../polyfill'

const App = () => {
  // Note that the Android SDK is slightly peculiar
  // in that it requires setting an access token,
  // even though it will be null for most users(only Mapbox authenticates this way)
  // MapLibreGL.setAccessToken(null)
  Mapbox.setAccessToken(Config.MAPBOX_ACCESS_TOKEN)

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
    'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead.',
  ])

  const { restored: accountsRestored } = useAccountStorage()
  const { setOpenedNotification } = useNotificationStorage()
  const [navReady, setNavReady] = useState(false)
  const splashHidden = useRef(false)

  const linking = useDeepLinking()

  const themeObject = useMemo(() => {
    return darkTheme
  }, [])

  const onReady = useCallback(async () => {
    setNavReady(true)
  }, [])

  useEffect(() => {
    if (splashHidden.current) {
      return
    }

    if (navReady) {
      splashHidden.current = true
      BootSplash.hide({ fade: true })
    }
  }, [navReady, splashHidden])

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
                  <WalletOnboardingProvider baseUrl={Config.ONBOARDING_API_URL}>
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
                                  onReady={onReady}
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
                              </>
                            )}
                          </LockScreen>
                        </HotspotOnboardingProvider>
                      </WalletConnectProvider>
                    </KeystoneOnboardingProvider>
                  </WalletOnboardingProvider>
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
