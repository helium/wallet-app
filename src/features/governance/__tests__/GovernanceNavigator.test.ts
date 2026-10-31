import { ReactElement } from 'react'
import GovernanceNavigator from '../GovernanceNavigator'

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'NativeStackNavigator',
    Screen: 'NativeStackScreen',
  }),
}))
jest.mock(
  '@storage/AppStorageProvider',
  () => ({ useAppStorage: () => ({ voteTutorialShown: false }) }),
  { virtual: true },
)
jest.mock('../GovernanceTutorialScreen', () => 'GovernanceTutorialScreen')
jest.mock('../ProposalsScreen', () => 'ProposalsScreen')
jest.mock('../PositionsScreen', () => 'PositionsScreen')
jest.mock('../ProxiesScreen', () => 'ProxiesScreen')
jest.mock('../ProposalScreen', () => 'ProposalScreen')
jest.mock('../ProxyScreen', () => 'ProxyScreen')
jest.mock('../AssignProxyScreen', () => 'AssignProxyScreen')
jest.mock('../RevokeProxyScreen', () => 'RevokeProxyScreen')

type ScreenProps = { name: string; options?: Record<string, unknown> }
type NavigatorProps = {
  screenOptions?: Record<string, unknown>
  children: (ReactElement<ScreenProps> | false)[]
}

// The navigator is a memo component whose body only reads one storage hook,
// so calling it returns the element tree without a renderer.
const renderNavigator = () => {
  const { type } = GovernanceNavigator as unknown as {
    type: () => ReactElement<NavigatorProps>
  }
  const navigator = type()
  const screens = navigator.props.children.filter(
    (child): child is ReactElement<ScreenProps> => !!child,
  )
  const animationOf = (name: string) => {
    const screen = screens.find((s) => s.props.name === name)
    return {
      ...navigator.props.screenOptions,
      ...screen?.props.options,
    }.animation
  }
  return { navigator, screens, animationOf }
}

describe('GovernanceNavigator', () => {
  it('is a native stack', () => {
    const { navigator, screens } = renderNavigator()

    expect(navigator.type).toBe('NativeStackNavigator')
    screens.forEach((screen) => expect(screen.type).toBe('NativeStackScreen'))
  })

  it.each(['ProposalsScreen', 'PositionsScreen', 'ProxiesScreen'])(
    'switches to the peer view %s without animation',
    (name) => {
      expect(renderNavigator().animationOf(name)).toBe('none')
    },
  )

  it.each([
    'ProposalScreen',
    'ProxyScreen',
    'AssignProxyScreen',
    'RevokeProxyScreen',
  ])('pushes the detail screen %s with the platform animation', (name) => {
    expect(renderNavigator().animationOf(name)).toBe('default')
  })
})
