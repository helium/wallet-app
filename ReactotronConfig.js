import AsyncStorage from '@react-native-async-storage/async-storage'
// eslint-disable-next-line import/no-extraneous-dependencies
import Reactotron from 'reactotron-react-native'

const reactotron = Reactotron.configure().useReactNative()

if (reactotron.setAsyncStorageHandler) {
  reactotron.setAsyncStorageHandler(AsyncStorage)
}

// eslint-disable-next-line no-undef
if (__DEV__) {
  reactotron.connect()
}
export default reactotron
