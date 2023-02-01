import AsyncStorage from '@react-native-async-storage/async-storage'
// eslint-disable-next-line import/no-extraneous-dependencies
import Reactotron from 'reactotron-react-native'
// eslint-disable-next-line import/no-extraneous-dependencies
import { reactotronRedux } from 'reactotron-redux'

const reactotron = Reactotron.configure()
  .useReactNative()
  .use(reactotronRedux())

if (reactotron.setAsyncStorageHandler) {
  reactotron.setAsyncStorageHandler(AsyncStorage)
}

// eslint-disable-next-line no-undef
if (__DEV__) {
  reactotron.connect()
}
export default reactotron
