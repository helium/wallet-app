import { createNavigationContainerRef } from '@react-navigation/native'
import { HomeStackParamList } from '../features/home/homeTypes'
import { RootStackParamList } from './rootTypes'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navToImportAccount = (
  params: HomeStackParamList['ReImportAccountNavigator'],
) => {
  if (!navigationRef.isReady()) return
  navigationRef.navigate('ReImportAccountNavigator' as any, params as any)
}
