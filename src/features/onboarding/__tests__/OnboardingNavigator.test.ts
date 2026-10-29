import { ReactElement } from 'react'
import OnboardingNavigator from '../OnboardingNavigator'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (fn: () => unknown) => fn(),
}))
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'NativeStackNavigator',
    Screen: 'NativeStackScreen',
  }),
}))
jest.mock('../../ledger/LedgerNavigator', () => 'LedgerNavigator')
jest.mock('../CreateImportAccountScreen', () => 'CreateImportAccountScreen')
jest.mock('../create/CreateAccountNavigator', () => 'CreateAccountNavigator')
jest.mock('../import/ImportAccountNavigator', () => 'ImportAccountNavigator')
jest.mock('../import/ImportPrivateKey', () => 'ImportPrivateKey')
jest.mock('../../keystone/KeystoneNavigator', () => 'KeystoneNavigator')

type ScreenProps = { name: string; options?: Record<string, unknown> }
type NavigatorProps = {
  screenOptions?: Record<string, unknown>
  children: ReactElement<ScreenProps>[]
}

// The navigator is a memo component whose body only builds memoised options,
// so calling it returns the element tree without a renderer.
const renderNavigator = () => {
  const { type } = OnboardingNavigator as unknown as {
    type: () => ReactElement<NavigatorProps>
  }
  const navigator = type()
  const optionsOf = (name: string) => {
    const screen = navigator.props.children.find((s) => s.props.name === name)
    return {
      ...navigator.props.screenOptions,
      ...screen?.props.options,
    }
  }
  return { navigator, optionsOf }
}

describe('OnboardingNavigator', () => {
  it.each([
    'CreateAccount',
    'ImportAccount',
    'LedgerNavigator',
    'KeystoneNavigator',
  ])('presents the sub-flow %s as a modal sliding from the bottom', (name) => {
    const options = renderNavigator().optionsOf(name)

    expect(options.presentation).toBe('modal')
    expect(options.animation).toBe('slide_from_bottom')
  })

  it('keeps the default animation on CreateImport', () => {
    expect(
      renderNavigator().optionsOf('CreateImport').animation,
    ).toBeUndefined()
  })
})
