import { AnyAction, combineReducers } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistReducer } from 'redux-persist'
import solanaReducer, { name as solanaSliceName } from './slices/solanaSlice'
import notificationsReducer, {
  name as notificationsSliceName,
} from './slices/notificationsSlice'
import balancesReducer, {
  name as balancesSliceName,
} from './slices/balancesSlice'
import hotspotReducer, {
  name as hotspotSliceName,
} from './slices/hotspotsSlice'

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
  [solanaSliceName]: persistReducer(solanaConfig, solanaReducer),
  [balancesSliceName]: persistReducer(balancesConfig, balancesReducer),
  [notificationsSliceName]: persistReducer(
    notificationsConfig,
    notificationsReducer,
  ),
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
