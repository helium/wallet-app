import React, { useEffect, useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { Text, useColorScheme, LogBox } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import { NavigationContainer } from '@react-navigation/native'
import useAppState from 'react-native-appstate-hook'
import * as SplashScreen from 'expo-splash-screen'
import { useApolloClient } from './graphql/useApolloClient'
import { theme, darkThemeColors, lightThemeColors } from './theme/theme'
import RootNavigator from './navigation/RootNavigator'
import { useAccountStorage } from './storage/AccountStorageProvider'
import LockScreen from './features/lock/LockScreen'
import SecurityScreen from './features/security/SecurityScreen'

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

  useEffect(() => {
    if (!accountsRestored) return

    SplashScreen.hideAsync()
  }, [accountsRestored])

  if (!client || loadingClient) {
    return <Text>Splash Screen</Text>
  }

  return (
    <ThemeProvider theme={colorAdaptedTheme}>
      <ApolloProvider client={client}>
        <LockScreen>
          <>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <SecurityScreen
              visible={appState !== 'active' && appState !== 'unknown'}
            />
          </>
        </LockScreen>
      </ApolloProvider>
    </ThemeProvider>
  )
}

export default App
