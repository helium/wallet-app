import { StackNavigationProp } from '@react-navigation/stack'

export type SettingsStackParamList = {
  Settings: undefined
  SettingsConfirmPin: {
    pin: string
    action?: 'remove' | 'create' | 'reset' | 'revealWords' | 'disablePaymentPin'
  }
  SettingsCreatePin: undefined
  RevealWords: undefined
  UpdateAlias: undefined
}

export type SettingsNavigationProp = StackNavigationProp<SettingsStackParamList>
