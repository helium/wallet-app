import { useCallback, useReducer } from 'react'

const FilterTypeKeys = ['all', 'in', 'out', 'delegate', 'mint'] as const
export type FilterType = typeof FilterTypeKeys[number]

type ActivityFilter = {
  filter: FilterType
  visible: boolean
}

const initialState = {
  filter: 'all',
  visible: false,
} as ActivityFilter

type ToggleFilter = {
  type: 'toggle'
}

type ChangeFilter = {
  type: 'change'
  filter: FilterType
}

function layoutReducer(
  state: ActivityFilter,
  action: ToggleFilter | ChangeFilter,
) {
  switch (action.type) {
    case 'toggle': {
      return {
        ...state,
        visible: !state.visible,
      }
    }
    case 'change': {
      return { ...state, filter: action.filter }
    }
  }
}

export const useActivityFilter = () => {
  const [state, dispatch] = useReducer(layoutReducer, initialState)
  const toggle = useCallback(() => dispatch({ type: 'toggle' }), [dispatch])
  const change = useCallback(
    (filter: FilterType) => dispatch({ type: 'change', filter }),
    [dispatch],
  )
  return { ...state, toggle, change }
}
