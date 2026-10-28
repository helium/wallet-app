import {
  NavigationProp,
  ParamListBase,
  createNavigationContainerRef,
} from '@react-navigation/native'
import { HomeStackParamList } from '../features/home/homeTypes'
import { RootStackParamList } from './rootTypes'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navToImportAccount = (
  params: HomeStackParamList['ReImportAccountNavigator'],
) => {
  if (!navigationRef.isReady()) return
  navigationRef.navigate(
    'TabBarNavigator',
    {
      screen: 'Home',
      params: { screen: 'ReImportAccountNavigator', params },
    },
    { pop: true },
  )
}

// Screens that hosts on the Home and Collectables stacks register as siblings.
// A host on the root stack has no such sibling, so it routes into Home.
export const navigateToHomeScreen = (
  navigation: NavigationProp<ParamListBase>,
  screen: 'PaymentQrScanner' | 'AddNewContact',
) => {
  if (navigation.getState()?.routeNames.includes(screen)) {
    navigation.navigate(screen)
    return
  }
  const tabBarParams: RootStackParamList['TabBarNavigator'] = {
    screen: 'Home',
    params: { screen },
  }
  navigation.navigate('TabBarNavigator', tabBarParams, { pop: true })
}
