import { StackNavigationProp } from '@react-navigation/stack'

export type HomeStackParamList = {
  Home: undefined
  AddAccount: {
    screen: 'Welcome'
    params: {
      multiAccount: true
    }
  }
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
