import { StackNavigationProp } from '@react-navigation/stack'
import {
  AccountView,
  SecureAccount,
  CSAccount,
} from '../../storage/AccountStorageProvider'

export type OnboardingStackParamList = {
  Welcome: undefined
  AccountCreatePassphraseScreen: undefined
  AccountEnterPassphraseScreen: SecureAccount
  AccountAssignScreen: SecureAccount
  AccountCreatePinScreen:
    | {
        pinReset?: boolean
        account?: SecureAccount & CSAccount
        viewType: AccountView
      }
    | undefined
  AccountConfirmPinScreen: {
    pin: string
    pinReset?: boolean
    account?: SecureAccount & CSAccount
    viewType?: AccountView
  }
  AccountImportScreen: undefined
  ImportAccountConfirmScreen: { words: Array<string> }
  AccountImportCompleteScreen: { words: Array<string> }
}

export type OnboardingNavigationProp =
  StackNavigationProp<OnboardingStackParamList>
