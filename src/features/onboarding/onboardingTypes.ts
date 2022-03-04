import { StackNavigationProp } from '@react-navigation/stack'
import { CSAccount } from '../../storage/cloudStorage'
import { SecureAccount } from '../../storage/secureStorage'

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
