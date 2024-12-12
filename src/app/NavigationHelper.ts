import { createNavigationContainerRef } from '@react-navigation/native'
import { AccountsServiceStackParamList } from 'src/app/services/AccountsService/pages/YourWalletsPage'
import { RootStackParamList } from './rootTypes'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navToImportAccount = (
  params: AccountsServiceStackParamList['ReImportAccountNavigator'],
) => {
  if (!navigationRef.isReady()) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigationRef.navigate('ReImportAccountNavigator' as any, params as any)
}
