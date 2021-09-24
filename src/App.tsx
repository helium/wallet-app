import React, { useMemo } from 'react'
import { ApolloProvider } from '@apollo/client'
import { Text, useColorScheme } from 'react-native'
import { ThemeProvider } from '@shopify/restyle'
import AccountInfo from './AccountInfo'
import { useApolloClient } from './graphql/useApolloClient'
import { theme, darkThemeColors, lightThemeColors } from './theme/theme'

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
