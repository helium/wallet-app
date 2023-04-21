/* eslint-disable no-console */
import Config from 'react-native-config'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const prettyPrintToConsole = (whatever: unknown, prefix = '') => {
  console.log(`${prefix}\n${JSON.stringify(whatever, null, 2)}`)
}

export const error = (e: unknown) => {
  if (__DEV__) {
    console.error(e)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const breadcrumb = (message: string, data?: any) => {
  const crumb = {
    message,
    data,
  }
  if (__DEV__ && Config.LOG_BREADCRUMBS === 'true') {
    if (data) {
      prettyPrintToConsole(crumb)
    } else {
      console.log(message)
    }
  }
}

export const logAsyncStorage = () => {
  AsyncStorage.getAllKeys().then((keyArray) => {
    AsyncStorage.multiGet(keyArray).then((keyValArray) => {
      const myStorage: unknown = {}
      // eslint-disable-next-line no-restricted-syntax
      for (const keyVal of keyValArray) {
        // eslint-disable-next-line prefer-destructuring, @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line prefer-destructuring
        myStorage[keyVal[0]] = keyVal[1]
      }

      console.log('CURRENT STORAGE: ', myStorage)
    })
  })
}
