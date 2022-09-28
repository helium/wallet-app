import { createNavigationContainerRef } from '@react-navigation/native'
import { RootNavigationProp } from './rootTypes'
import { HomeStackParamList } from '../features/home/homeTypes'

export const navigationRef = createNavigationContainerRef<RootNavigationProp>()

export const navToImportAccount = (
  params: HomeStackParamList['ReImportAccountNavigator'],
) => {
  if (!navigationRef.isReady()) return
  navigationRef.navigate('ReImportAccountNavigator' as never, params as never)
}
