import { NavigationProp, ParamListBase } from '@react-navigation/native'
import {
  navigateToHomeScreen,
  navigationRef,
  navToImportAccount,
} from '../NavigationHelper'

// @react-navigation/native ships ESM that jest does not transform. The helper
// only needs a container ref whose methods the tests spy on.
jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: () => false,
    navigate: () => undefined,
  }),
}))

const fakeNavigation = (routeNames: string[]) => {
  const navigate = jest.fn()
  const navigation = {
    getState: () => ({ routeNames }),
    navigate,
  } as unknown as NavigationProp<ParamListBase>
  return { navigation, navigate }
}

describe('navigateToHomeScreen', () => {
  it('navigates on the host stack when it registers the screen', () => {
    const { navigation, navigate } = fakeNavigation([
      'PaymentScreen',
      'PaymentQrScanner',
    ])

    navigateToHomeScreen(navigation, 'PaymentQrScanner')

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('PaymentQrScanner')
  })

  it('routes into Home and pops the root host when the host lacks the screen', () => {
    const { navigation, navigate } = fakeNavigation([
      'TabBarNavigator',
      'PaymentScreen',
    ])

    navigateToHomeScreen(navigation, 'AddNewContact')

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(
      'TabBarNavigator',
      { screen: 'Home', params: { screen: 'AddNewContact' } },
      { pop: true },
    )
  })
})

describe('navToImportAccount', () => {
  afterEach(() => jest.restoreAllMocks())

  it('pops back to the existing tab bar', () => {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true)
    const navigate = jest
      .spyOn(navigationRef, 'navigate')
      .mockImplementation(() => undefined)

    const params = {
      screen: 'AccountImportScreen' as const,
      params: { restoringAccount: true, accountAddress: 'addr' },
    }
    navToImportAccount(params)

    expect(navigate).toHaveBeenCalledWith(
      'TabBarNavigator',
      {
        screen: 'Home',
        params: {
          screen: 'ReImportAccountNavigator',
          params,
        },
      },
      { pop: true },
    )
  })
})
