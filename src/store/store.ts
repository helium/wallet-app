import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useStore } from 'react-redux'
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import { setupListeners } from '@reduxjs/toolkit/query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import reducer from './rootReducer'
import { solanaStatusApi } from './slices/solanaStatusApi'

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: [solanaStatusApi.reducerPath],
}

const persistedReducer = persistReducer(persistConfig, reducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat([solanaStatusApi.middleware]),
})

setupListeners(store.dispatch)

export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export type AppStore = typeof store
export const useAppStore = () => useStore<AppStore>()

export default store
