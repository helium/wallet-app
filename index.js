// Must be the first import. cbor-sync (reached via the navigator tree ->
// keystone-sdk -> bc-ur-registry) registers its Buffer reader/writer once, at
// module load, behind a `typeof Buffer` guard. Anything that loads it before
// global.Buffer exists leaves the Keystone sign request unable to encode
// ("Unsupported output format: undefined").
import './src/polyfill'
import { ThemeProvider } from '@shopify/restyle'
import React, { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-url-polyfill/auto'
import { name as appName } from './app.json'
import App from './src/App'
import { GlobalError } from './src/components/GlobalError'
import AccountStorageProvider from './src/storage/AccountStorageProvider'
import AppStorageProvider from './src/storage/AppStorageProvider'
import { importLegacyState } from './src/storage/importLegacyState'
import LanguageProvider from './src/storage/LanguageProvider'
import NotificationStorageProvider from './src/storage/NotificationStorageProvider'
import { darkThemeColors, theme } from './src/theme/theme'
import './src/utils/i18n'

const originalHandler = global.ErrorUtils?.getGlobalHandler?.()
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  console.error('Global error handler:', error, 'isFatal:', isFatal)
  if (originalHandler) {
    originalHandler(error, isFatal)
  }
})

const handleUnhandledRejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Don't crash the app for unhandled promises in production
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault?.()
  }
}

if (typeof global !== 'undefined' && global.addEventListener) {
  global.addEventListener('unhandledrejection', handleUnhandledRejection)
} else if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason, _promise) => {
    console.error('Unhandled promise rejection:', reason)
  })
}

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

// Renders nothing until the first-launch import has filled the stores
// eslint-disable-next-line react/prop-types
const LegacyImportGate = ({ children }) => {
  const [imported, setImported] = useState(false)
  useEffect(() => {
    importLegacyState()
      .catch((e) => console.error('Legacy state import failed', e))
      .finally(() => setImported(true))
  }, [])
  return imported ? children : null
}

const render = () => {
  return (
    <ThemeProvider
      theme={{
        ...theme,
        colors: darkThemeColors,
      }}
    >
      <ErrorBoundary fallbackRender={fallbackRender}>
        <LegacyImportGate>
          <LanguageProvider>
            <AppStorageProvider>
              <AccountStorageProvider>
                <NotificationStorageProvider>
                  <App />
                </NotificationStorageProvider>
              </AccountStorageProvider>
            </AppStorageProvider>
          </LanguageProvider>
        </LegacyImportGate>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

AppRegistry.registerComponent(appName, () => render)
