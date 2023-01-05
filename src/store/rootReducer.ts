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
import appReducer, { name as appSliceName } from './slices/appSlice'
import authReducer, { name as authSliceName } from './slices/authSlice'
import hotspotReducer, {
  name as hotspotSliceName,
} from './slices/hotspotsSlice'

const solanaConfig = {
  key: solanaSliceName,
  storage: AsyncStorage,
  blacklist: ['payment'],
}

const reducer = combineReducers({
  [solanaStatusApi.reducerPath]: solanaStatusReducer,
  [collectablesSliceName]: collectablesReducer,
  [solanaSliceName]: persistReducer(solanaConfig, solanaReducer),
  [authSliceName]: authReducer,
  [walletRestApi.reducerPath]: walletRestApiReducer,
  [appSliceName]: appReducer,
  [hotspotSliceName]: hotspotReducer,
})

export const rootReducer = (state: RootState, action: AnyAction) => {
  if (action.type === 'logout/LOGOUT') {
    return reducer(undefined, action)
  }
  return reducer(state, action)
}

export type RootState = ReturnType<typeof reducer>

export default reducer
