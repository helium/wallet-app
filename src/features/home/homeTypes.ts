import { Ticker } from '@helium/currency'
import { LinkWalletRequest, SignHotspotRequest } from '@helium/wallet-link'
import { Sft, SftWithToken, Nft, NftWithToken } from '@metaplex-foundation/js'
import { StackNavigationProp } from '@react-navigation/stack'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
  defaultTokenType?: Ticker
  collectable?: Sft | SftWithToken | Nft | NftWithToken
}

export type BurnRouteParam = {
  address: string
  amount: string
  memo?: string
}

export type HomeStackParamList = {
  AccountsScreen: undefined
  AccountTokenScreen: { tokenType: Ticker }
  AccountCollectionScreen: {
    collection: (Sft | SftWithToken | Nft | NftWithToken)[]
  }
  AccountCollectableScreen: {
    collectable: Sft | SftWithToken | Nft | NftWithToken
  }
  AccountAssignScreen: undefined
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
  SignHotspot: SignHotspotRequest
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
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
