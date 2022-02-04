import React from 'react'
import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import App from './src/App'
import { name as appName } from './app.json'
import './src/utils/i18n'
import AccountStorageProvider from './src/storage/AccountStorageProvider'
import AppStorageProvider from './src/storage/AppStorageProvider'
import LanguageProvider from './src/storage/LanguageProvider'

const render = () => {
  return (
    <LanguageProvider>
      <AppStorageProvider>
        <AccountStorageProvider>
          <App />
        </AccountStorageProvider>
      </AppStorageProvider>
    </LanguageProvider>
  )
}

AppRegistry.registerComponent(appName, () => render)
