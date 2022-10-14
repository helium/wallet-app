import { AnyAction, combineReducers } from '@reduxjs/toolkit'
import {
  reducer as solanaStatusReducer,
  solanaStatusApi,
} from './slices/solanaStatusApi'
import solanaReducer, { name as solanaName } from './slices/solanaSlice'

const reducer = combineReducers({
  [solanaStatusApi.reducerPath]: solanaStatusReducer,
  [solanaName]: solanaReducer,
})

export const rootReducer = (state: RootState, action: AnyAction) => {
  if (action.type === 'logout/LOGOUT') {
    return reducer(undefined, action)
  }
  return reducer(state, action)
}

export type RootState = ReturnType<typeof reducer>

export default reducer
