import { Route } from '@react-navigation/native'
import { useSyncExternalStore } from 'react'
import { navigationRef } from '../navigation/NavigationHelper'

const subscribe = (onChange: () => void) =>
  navigationRef.addListener('state', onChange)

const getCurrentRoute = (): Route<string> | undefined =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined

// Reads the focused route from the container ref, not from a navigator, so
// providers between NavigationContainer and RootNavigator can use it.
export const useCurrentRoute = () =>
  useSyncExternalStore(subscribe, getCurrentRoute)
