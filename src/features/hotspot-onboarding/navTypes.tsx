import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type IotBleOptions = {
  bleInstructions?: string
}

export type OnboardableDevice = {
  name: string
  type: 'IotBle'
  image?: string
  icon?: React.ReactElement
  options: IotBleOptions
}

export type OnboardingtackParamList = {
  IotBle: IotBleOptions
  SelectDevice: undefined
}

export type OnboardingNavProp =
  NativeStackNavigationProp<OnboardingtackParamList>
