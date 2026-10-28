import { AnyAction, combineReducers } from '@reduxjs/toolkit'
import solanaReducer, { name as solanaSliceName } from './slices/solanaSlice'

const reducer = combineReducers({
  [solanaSliceName]: solanaReducer,
})

export const rootReducer = (state: RootState, action: AnyAction) => {
  if (action.type === 'logout/LOGOUT') {
    return reducer(undefined, action)
  }
  return reducer(state, action)
}

export type RootState = ReturnType<typeof reducer>

export default reducer
