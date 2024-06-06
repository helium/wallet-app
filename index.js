import { ThemeProvider } from '@shopify/restyle'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-url-polyfill/auto'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { name as appName } from './app.json'
import App from './src/App'
import { GlobalError } from './src/components/GlobalError'
import AccountStorageProvider from './src/storage/AccountStorageProvider'
import AppStorageProvider from './src/storage/AppStorageProvider'
import LanguageProvider from './src/storage/LanguageProvider'
import NotificationStorageProvider from './src/storage/NotificationStorageProvider'
import { persistor } from './src/store/persistence'
import store from './src/store/store'
import { darkThemeColors, theme } from './src/theme/theme'
import './src/utils/i18n'

// eslint-disable-next-line no-undef
if (__DEV__) {
  import('./ReactotronConfig')
}

function fallbackRender(props) {
  return (
    <SafeAreaProvider>
      <GlobalError {...props} />
    </SafeAreaProvider>
  )
}

const render = () => {
  return (
    <ThemeProvider
      theme={{
        ...theme,
        colors: darkThemeColors,
      }}
    >
      <ErrorBoundary
        fallbackRender={fallbackRender}
        onReset={async () => {
          await persistor.purge()
        }}
      >
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <LanguageProvider>
              <AppStorageProvider>
                <AccountStorageProvider>
                  <NotificationStorageProvider>
                    <App />
                  </NotificationStorageProvider>
                </AccountStorageProvider>
              </AppStorageProvider>
            </LanguageProvider>
          </PersistGate>
        </ReduxProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

AppRegistry.registerComponent(appName, () => render)
