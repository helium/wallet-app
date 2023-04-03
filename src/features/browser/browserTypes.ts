import { StackNavigationProp } from '@react-navigation/stack'

export type BrowserStackParamList = {
  DAppTutorial: undefined
  BrowserScreen: undefined
  BrowserWebViewScreen: {
    uri: string
  }
}

export type BrowserNavigationProp = StackNavigationProp<BrowserStackParamList>
