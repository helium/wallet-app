import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type BrowserStackParamList = {
  DAppTutorial: undefined
  BrowserScreen: undefined
  BrowserWebViewScreen: {
    uri: string
  }
}

export type BrowserNavigationProp =
  NativeStackNavigationProp<BrowserStackParamList>
