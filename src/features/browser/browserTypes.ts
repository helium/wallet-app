import { StackNavigationProp } from '@react-navigation/stack'

export type BrowserStackParamList = {
  BrowserScreen: undefined
  BrowserWebViewScreen: {
    uri: string
  }
}

export type BrowserNavigationProp = StackNavigationProp<BrowserStackParamList>
