import { StackNavigationProp } from '@react-navigation/stack'
import { CSAccount } from '../../../storage/cloudStorage'
import { SecureAccount } from '../../../storage/secureStorage'

export type ImportAccountStackParamList = {
  AccountImportStartScreen: undefined
  AccountImportScreen: { wordCount: 12 | 24 }
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

export type ImportAccountNavigationProp =
  StackNavigationProp<ImportAccountStackParamList>
