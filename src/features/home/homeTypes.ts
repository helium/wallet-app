import { Ticker } from '@helium/currency'
import { LinkWalletRequest, SignHotspotRequest } from '@helium/wallet-link'
import { StackNavigationProp } from '@react-navigation/stack'
import { Collectable } from '../../types/solana'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
  defaultTokenType?: Ticker
  collectable?: Collectable
}

export type BurnRouteParam = {
  address: string
  amount: string
  memo?: string
}

export type HomeStackParamList = {
  AccountsScreen: undefined
  AccountTokenScreen: { tokenType: Ticker }
  AccountAssignScreen:
    | undefined
    | {
        secureAccount?: {
          mnemonic: string[]
          keypair: { pk: string; sk: string }
          address: string
        }
      }
  AccountCollectionScreen: {
    collection: Collectable[]
  }
  AccountCollectableScreen: {
    collectable: Collectable
  }
  ConfirmPin: {
    action: 'payment'
  }
  PaymentScreen: undefined | PaymentRouteParam
  BurnScreen: BurnRouteParam
  PaymentQrScanner: undefined
  RequestScreen: undefined
  OnboardData: undefined
  DappLoginScreen: { uri: string; callback: string }
  AddressBookNavigator: undefined
  NotificationsNavigator: undefined
  SettingsNavigator: undefined
  AddNewContact: undefined
  LinkWallet: LinkWalletRequest
  SignHotspot: SignHotspotRequest & { submit?: boolean }
  AddNewAccountNavigator: undefined
  ReImportAccountNavigator:
    | undefined
    | {
        screen: 'AccountImportScreen'
        params: {
          restoringAccount?: boolean
          accountAddress?: string
        }
      }
  VoteNavigator: undefined
  ImportPrivateKey: { key?: string }
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
