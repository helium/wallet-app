import { StackNavigationProp } from '@react-navigation/stack'

export type SettingsStackParamList = {
  Settings: undefined
  SettingsConfirmPin: {
    pin: string
    action?:
      | 'remove'
      | 'create'
      | 'reset'
      | 'revealWords'
      | 'revealPrivateKey'
      | 'disablePaymentPin'
  }
  SettingsCreatePin: undefined
  RevealWords: undefined
  RevealPrivateKey: undefined
  UpdateAlias: undefined
  ShareAddress: undefined
  ConfirmSignout: undefined
  MigrateWallet: undefined
  AutoGasManager: undefined
}

export type SettingsNavigationProp = StackNavigationProp<SettingsStackParamList>
