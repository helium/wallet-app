import { useNavigationState, NavigationState } from '@react-navigation/native'
import { useMemo } from 'react'

export const useCurrentRoute = () => {
  const navState = useNavigationState((state) => state)
  const currentRoute = useMemo(() => {
    const getCurrentRoute = (
      state: NavigationState | undefined,
    ): NavigationState | undefined => {
      if (!state || !state.routes || state.routes.length === 0) return state
      const nestedState = state.routes[state.index]?.state as
        | NavigationState
        | undefined
      return nestedState ? getCurrentRoute(nestedState) : state
    }

    const routeState = getCurrentRoute(navState)
    return routeState?.routes[routeState.index]
  }, [navState])

  return currentRoute
}
