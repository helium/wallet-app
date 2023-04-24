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
import balancesReducer, {
  name as balancesSliceName,
} from './slices/balancesSlice'
import collectablesReducer, {
  name as collectablesSliceName,
} from './slices/collectablesSlice'
import appReducer, { name as appSliceName } from './slices/appSlice'
import authReducer, { name as authSliceName } from './slices/authSlice'
import hotspotReducer, {
  name as hotspotSliceName,
} from './slices/hotspotsSlice'
import browserReducer, { name as browserSliceName } from './slices/browserSlice'

const solanaConfig = {
  key: solanaSliceName,
  storage: AsyncStorage,
  blacklist: ['payment'],
}

const balancesConfig = {
  key: balancesSliceName,
  storage: AsyncStorage,
  blacklist: ['balancesLoading'],
}

const walletRestConfig = {
  key: walletRestApi.reducerPath,
  storage: AsyncStorage,
  blacklist: ['queries', 'mutations'],
}

const reducer = combineReducers({
  [solanaStatusApi.reducerPath]: solanaStatusReducer,
  [collectablesSliceName]: collectablesReducer,
  [solanaSliceName]: persistReducer(solanaConfig, solanaReducer),
  [balancesSliceName]: persistReducer(balancesConfig, balancesReducer),
  [authSliceName]: authReducer,
  [walletRestApi.reducerPath]: persistReducer(
    walletRestConfig,
    walletRestApiReducer,
  ),
  [appSliceName]: appReducer,
  [hotspotSliceName]: hotspotReducer,
  [browserSliceName]: browserReducer,
})

export const rootReducer = (state: RootState, action: AnyAction) => {
  if (action.type === 'logout/LOGOUT') {
    return reducer(undefined, action)
  }
  return reducer(state, action)
}

export type RootState = ReturnType<typeof reducer>

export default reducer
