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
import collectablesReducer, {
  name as collectablesSliceName,
} from './slices/collectablesSlice'
import authReducer, { name as authSliceName } from './slices/authSlice'
import appNavReducer, { name as appNavSliceName } from './slices/AppNavSlice'

const solanaConfig = {
  key: solanaSliceName,
  storage: AsyncStorage,
  blacklist: ['payment'],
}

const reducer = combineReducers({
  [appNavSliceName]: appNavReducer,
  [solanaStatusApi.reducerPath]: solanaStatusReducer,
  [collectablesSliceName]: collectablesReducer,
  [solanaSliceName]: persistReducer(solanaConfig, solanaReducer),
  [authSliceName]: authReducer,
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
