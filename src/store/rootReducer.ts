import { AnyAction, combineReducers } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistReducer } from 'redux-persist'
import {
  reducer as solanaStatusReducer,
  solanaStatusApi,
} from './slices/solanaStatusApi'
import {
  reducer as walletRestApiReducer,
  walletRestApi,
} from './slices/walletRestApi'
import solanaReducer, { name as solanaSliceName } from './slices/solanaSlice'

const solanaConfig = {
  key: solanaSliceName,
  storage: AsyncStorage,
  blacklist: ['payment'],
}

const reducer = combineReducers({
  [solanaStatusApi.reducerPath]: solanaStatusReducer,
  [solanaSliceName]: persistReducer(solanaConfig, solanaReducer),
  [walletRestApi.reducerPath]: walletRestApiReducer,
})

export const rootReducer = (state: RootState, action: AnyAction) => {
  if (action.type === 'logout/LOGOUT') {
    return reducer(undefined, action)
  }
  return reducer(state, action)
}

export type RootState = ReturnType<typeof reducer>

export default reducer
