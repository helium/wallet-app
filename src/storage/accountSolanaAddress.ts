import { heliumAddressToSolAddress } from '../utils/accountUtils'
import Config from '../utils/config'

// VIEW_AS swaps every account and contact for another wallet, so only a dev
// build honours it
export const accountSolanaAddress = (heliumAddress: string) =>
  (__DEV__ && Config.VIEW_AS) || heliumAddressToSolAddress(heliumAddress)
