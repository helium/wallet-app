import { StoreEnhancer, configureStore } from '@reduxjs/toolkit'
import { useDispatch, useStore } from 'react-redux'
import { persistReducer } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'
import reducer from './rootReducer'
import { name as solanaSliceName } from './slices/solanaSlice'
import { name as balancesSliceName } from './slices/balancesSlice'
import { name as notificationsSliceName } from './slices/notificationsSlice'
import Reactotron from '../../ReactotronConfig'

const enhancers: StoreEnhancer[] = []
if (Reactotron.createEnhancer && __DEV__) {
  enhancers.push(Reactotron.createEnhancer())
}

const persistConfig = {
  // Not 'root': the legacy import reads and removes persist:root
  key: 'root.v2',
  storage: AsyncStorage,
  version: 1,
  blacklist: [solanaSliceName, balancesSliceName, notificationsSliceName],
}

const persistedReducer = persistReducer(persistConfig, reducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
  enhancers,
})

export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export type AppStore = typeof store
export const useAppStore = () => useStore<AppStore>()

export default store
