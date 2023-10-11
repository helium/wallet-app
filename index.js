import React from 'react'
import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import { ThemeProvider } from '@shopify/restyle'
import { darkThemeColors, theme } from './src/theme/theme'
import App from './src/App'
import { name as appName } from './app.json'
import './src/utils/i18n'
import AccountStorageProvider from './src/storage/AccountStorageProvider'
import AppStorageProvider from './src/storage/AppStorageProvider'
import LanguageProvider from './src/storage/LanguageProvider'
import NotificationStorageProvider from './src/storage/NotificationStorageProvider'
import store from './src/store/store'

// eslint-disable-next-line no-undef
if (__DEV__) {
  import('./ReactotronConfig')
}

export const persistor = persistStore(store)

const render = () => {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LanguageProvider>
          <AppStorageProvider>
            <ThemeProvider
              theme={{
                ...theme,
                colors: darkThemeColors,
              }}
            >
              <AccountStorageProvider>
                <NotificationStorageProvider>
                  <App />
                </NotificationStorageProvider>
              </AccountStorageProvider>
            </ThemeProvider>
          </AppStorageProvider>
        </LanguageProvider>
      </PersistGate>
    </ReduxProvider>
  )
}

AppRegistry.registerComponent(appName, () => render)
