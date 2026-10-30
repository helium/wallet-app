import AsyncStorage from '@react-native-async-storage/async-storage'
import Reactotron from 'reactotron-react-native'

const reactotron = Reactotron.configure().useReactNative()

if (reactotron.setAsyncStorageHandler) {
  reactotron.setAsyncStorageHandler(AsyncStorage)
}

if (__DEV__) {
  reactotron.connect()
}
export default reactotron
