import { AnyAction, combineReducers } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistReducer } from 'redux-persist'
import {
  reducer as solanaStatusReducer,
  solanaStatusApi,
} from './slices/solanaStatusApi'
import solanaReducer, { name as solanaSliceName } from './slices/solanaSlice'
import notificationsReducer, {
  name as notificationsSliceName,
} from './slices/notificationsSlice'
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

const notificationsConfig = {
  key: notificationsSliceName,
  storage: AsyncStorage,
  blacklist: ['notificationsLoading'],
}

const balancesConfig = {
  key: balancesSliceName,
  storage: AsyncStorage,
  blacklist: ['balancesLoading'],
}

const reducer = combineReducers({
  [solanaStatusApi.reducerPath]: solanaStatusReducer,
  [collectablesSliceName]: collectablesReducer,
  [solanaSliceName]: persistReducer(solanaConfig, solanaReducer),
  [balancesSliceName]: persistReducer(balancesConfig, balancesReducer),
  [notificationsSliceName]: persistReducer(
    notificationsConfig,
    notificationsReducer,
  ),
  [authSliceName]: authReducer,
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
