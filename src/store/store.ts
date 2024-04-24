import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useStore } from 'react-redux'
import { persistReducer } from 'redux-persist'
import { setupListeners } from '@reduxjs/toolkit/query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import reducer from './rootReducer'
import { solanaStatusApi } from './slices/solanaStatusApi'
import { name as solanaSliceName } from './slices/solanaSlice'
import { name as balancesSliceName } from './slices/balancesSlice'
import { name as notificationsSliceName } from './slices/notificationsSlice'
import Reactotron from '../../ReactotronConfig'

const enhancers = []
if (Reactotron.createEnhancer && __DEV__) {
  enhancers.push(Reactotron.createEnhancer())
}

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  version: 1,
  blacklist: [
    solanaStatusApi.reducerPath,
    solanaSliceName,
    balancesSliceName,
    notificationsSliceName,
  ],
}

const persistedReducer = persistReducer(persistConfig, reducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat([solanaStatusApi.middleware]),
  enhancers,
})

setupListeners(store.dispatch)

export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export type AppStore = typeof store
export const useAppStore = () => useStore<AppStore>()

export default store
