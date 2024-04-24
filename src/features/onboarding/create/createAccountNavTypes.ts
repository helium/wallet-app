import { StackNavigationProp } from '@react-navigation/stack'
import { Keypair } from '@solana/web3.js'

export type CreateAccountStackParamList = {
  AccountCreateStartScreen: undefined
  AccountCreatePassphraseScreen: undefined
  AccountEnterPassphraseScreen:
    | undefined
    | { keypair?: Keypair; words: string[] }
  AccountAssignScreen: undefined | { keypair?: Keypair; words: string[] }
  AccountCreatePinScreen:
    | {
        pinReset?: boolean
        keypair?: Keypair
        words?: string[]
      }
    | undefined
  AccountConfirmPinScreen: {
    pin: string
    keypair?: Keypair
    words?: string[]
  }
}

export type CreateAccountNavigationProp =
  StackNavigationProp<CreateAccountStackParamList>
