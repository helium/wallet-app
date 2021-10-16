import React, { useEffect, useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { Text, useColorScheme, LogBox } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import useAppState from 'react-native-appstate-hook'
import * as SplashScreen from 'expo-splash-screen'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { useApolloClient } from './graphql/useApolloClient'
import { theme, darkThemeColors, lightThemeColors } from './theme/theme'
import RootNavigator from './navigation/RootNavigator'
import { useAccountStorage } from './storage/AccountStorageProvider'
import LockScreen from './features/lock/LockScreen'
import SecurityScreen from './features/security/SecurityScreen'
import useMount from './utils/useMount'
import OnboardingProvider from './features/onboarding/OnboardingProvider'

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

const App = () => {
  LogBox.ignoreLogs(['EventEmitter.removeListener'])

  const { appState } = useAppState()
  const { client, loading: loadingClient } = useApolloClient()
  const { restored: accountsRestored } = useAccountStorage()

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
    GoogleSignin.configure({
      iosClientId:
        '605970674117-ll6b47atjj62m8i7j698pojgrbdf3ko1.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
  })

  useEffect(() => {
    if (!accountsRestored) return

    SplashScreen.hideAsync()
  }, [accountsRestored])

  if (!client || loadingClient) {
    return <Text>Splash Screen</Text>
  }

  return (
    <OnboardingProvider>
      <ThemeProvider theme={colorAdaptedTheme}>
        <ApolloProvider client={client}>
          <LockScreen>
            <>
              <NavigationContainer theme={navTheme}>
                <RootNavigator />
              </NavigationContainer>
              <SecurityScreen
                visible={appState !== 'active' && appState !== 'unknown'}
              />
            </>
          </LockScreen>
        </ApolloProvider>
      </ThemeProvider>
    </OnboardingProvider>
  )
}

export default App
