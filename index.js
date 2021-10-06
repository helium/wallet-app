import React from 'react'
import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import App from './src/App'
import { name as appName } from './app.json'
import './src/utils/i18n'
import AccountStorageProvider from './src/storage/AccountStorageProvider'

const render = () => {
  return (
    <AccountStorageProvider>
      <App />
    </AccountStorageProvider>
  )
}

AppRegistry.registerComponent(appName, () => render)
