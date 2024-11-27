import { createNavigationContainerRef } from '@react-navigation/native'
import { AccountsServiceStackParamList } from 'src/app/services/AccountsService'
import { RootStackParamList } from './rootTypes'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navToImportAccount = (
  params: AccountsServiceStackParamList['ReImportAccountNavigator'],
) => {
  if (!navigationRef.isReady()) return
  navigationRef.navigate('ReImportAccountNavigator' as any, params as any)
}
