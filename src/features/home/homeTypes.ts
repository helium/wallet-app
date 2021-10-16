import { StackNavigationProp } from '@react-navigation/stack'

export type HomeStackParamList = {
  Home: undefined
  AddAccount: {
    screen: 'CreateImport'
  }
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
