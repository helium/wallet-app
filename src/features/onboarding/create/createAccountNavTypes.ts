import { StackNavigationProp } from '@react-navigation/stack'
import { CSAccount } from '../../../storage/cloudStorage'
import { SecureAccount } from '../../../storage/secureStorage'

export type CreateAccountStackParamList = {
  AccountCreateStartScreen: undefined
  AccountCreatePassphraseScreen: undefined
  AccountEnterPassphraseScreen: undefined | { secureAccount?: SecureAccount }
  AccountAssignScreen: undefined | { secureAccount?: SecureAccount }
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

export type CreateAccountNavigationProp =
  StackNavigationProp<CreateAccountStackParamList>
