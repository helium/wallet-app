import React, { useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { Text, useColorScheme } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import { useAsync } from 'react-async-hook'
import AccountInfo from './AccountInfo'
import { useApolloClient } from './graphql/useApolloClient'
import { theme, darkThemeColors, lightThemeColors } from './theme/theme'
import CloudStorage from './cloudStorage/CloudStorage'

const App = () => {
  const { client, loading: loadingClient } = useApolloClient()

  const colorScheme = useColorScheme()
  const colorAdaptedTheme = useMemo(
    () => ({
      ...theme,
      colors: colorScheme === 'light' ? lightThemeColors : darkThemeColors,
    }),
    [colorScheme],
  )

  // cloud storage test
  useAsync(async () => {
    const stored = await CloudStorage.getItem('test')
    console.log(stored)

    // uncomment and let this run once and you can test out the cloud storage for iOS
    // await CloudStorage.setItem('test', 'this is a test')
  }, [])

  if (!client || loadingClient) {
    return <Text>Splash Screen</Text>
  }

  return (
    <ThemeProvider theme={colorAdaptedTheme}>
      <ApolloProvider client={client}>
        <AccountInfo />
      </ApolloProvider>
    </ThemeProvider>
  )
}

export default App
