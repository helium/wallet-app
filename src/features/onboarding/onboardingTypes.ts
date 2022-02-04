import { StackNavigationProp } from '@react-navigation/stack'
import { SecureAccount, CSAccount } from '../../storage/AccountStorageProvider'

export type OnboardingStackParamList = {
  AccountCreatePassphraseScreen: undefined
  AccountEnterPassphraseScreen: undefined

  AccountImportScreen: undefined
  ImportAccountConfirmScreen: undefined
  AccountImportCompleteScreen: undefined

  AccountAssignScreen: undefined

  AccountCreatePinScreen:
    | {
        pinReset?: boolean
        account?: SecureAccount & CSAccount
      }
    | undefined
  AccountConfirmPinScreen: {
    pin: string
    account?: SecureAccount & CSAccount
  }
}

export type OnboardingNavigationProp =
  StackNavigationProp<OnboardingStackParamList>
