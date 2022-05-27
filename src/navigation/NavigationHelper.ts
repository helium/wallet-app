/* eslint-disable @typescript-eslint/no-explicit-any */
import { createNavigationContainerRef } from '@react-navigation/native'
import { RootNavigationProp } from './rootTypes'
import { HomeStackParamList } from '../features/home/homeTypes'

export const navigationRef = createNavigationContainerRef<RootNavigationProp>()

export const navToImportAccount = (
  params: HomeStackParamList['ImportAccount'],
) => {
  if (!navigationRef.isReady()) return
  navigationRef.navigate('ImportAccount' as never, params as never)
}
