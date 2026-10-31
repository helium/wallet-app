// Must be the first import. cbor-sync (reached via the navigator tree ->
// keystone-sdk -> bc-ur-registry) registers its Buffer reader/writer once, at
// module load, behind a `typeof Buffer` guard. Anything that loads it before
// global.Buffer exists leaves the Keystone sign request unable to encode
// ("Unsupported output format: undefined").
import './src/polyfill'
import './src/global.css'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-url-polyfill/auto'
import App from './src/App'
import { GlobalError } from './src/ui/GlobalError'
import AccountStorageProvider from './src/storage/AccountStorageProvider'
import AppStorageProvider from './src/storage/AppStorageProvider'
import LanguageProvider from './src/storage/LanguageProvider'
import NotificationStorageProvider from './src/storage/NotificationStorageProvider'
import { LegacyImportGate, resetAfterError } from './src/store/persistence'
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

const Root = () => {
  return (
    <ErrorBoundary fallbackRender={fallbackRender} onReset={resetAfterError}>
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
  )
}

// The dev UI gallery loads only when EXPO_PUBLIC_UI_GALLERY=1 is set at bundle
// time. Release builds inline the flag and fold the branch, so they drop the
// gallery module.
AppRegistry.registerComponent('main', () =>
  process.env.EXPO_PUBLIC_UI_GALLERY === '1'
    ? require('./src/features/uiGallery/UiGalleryScreen').default
    : Root,
)
