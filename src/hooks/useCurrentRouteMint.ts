import { useSyncExternalStore } from 'react'
import { navigationRef } from '../navigation/NavigationHelper'

const subscribe = (onChange: () => void) =>
  navigationRef.addListener('state', onChange)

const getCurrentRouteMint = (): string | undefined => {
  if (!navigationRef.isReady()) return undefined
  const params = navigationRef.getCurrentRoute()?.params as
    { mint?: unknown } | undefined
  return typeof params?.mint === 'string' ? params.mint : undefined
}

// Returns the mint string, not the route: getCurrentRoute can return a new
// object on each call, and useSyncExternalStore needs an equal snapshot.
// Reads from the container ref, so providers above RootNavigator can use it.
export const useCurrentRouteMint = () =>
  useSyncExternalStore(subscribe, getCurrentRouteMint)
