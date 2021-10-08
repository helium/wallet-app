import { StackNavigationProp } from '@react-navigation/stack'
import {
  AccountView,
  SecureAccount,
  CSAccount,
} from '../../storage/AccountStorageProvider'

export type OnboardingStackParamList = {
  Welcome: undefined | { multiAccount: boolean }

  AccountCreatePassphraseScreen: undefined | { multiAccount: boolean }
  AccountEnterPassphraseScreen: SecureAccount & { multiAccount?: boolean }

  AccountImportScreen: undefined | { multiAccount?: boolean }
  ImportAccountConfirmScreen: { words: Array<string>; multiAccount?: boolean }
  AccountImportCompleteScreen: { words: Array<string>; multiAccount?: boolean }

  AccountAssignScreen: SecureAccount & { multiAccount?: boolean }

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
}

export type OnboardingNavigationProp =
  StackNavigationProp<OnboardingStackParamList>
