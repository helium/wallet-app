import { heliumAddressToSolAddress } from '../utils/accountUtils'
import Config from '../utils/config'
import type { CSAccount } from './cloudStorage'

// VIEW_AS swaps every account and contact for another wallet, so only a dev
// build honours it
export const accountSolanaAddress = (heliumAddress: string) =>
  (__DEV__ && Config.VIEW_AS) || heliumAddressToSolAddress(heliumAddress)

// A contact pays the wallet its Helium address derives, never VIEW_AS. This
// also replaces a VIEW_AS address that an earlier build saved on the contact.
export const contactSolanaAddress = (
  contact: Pick<CSAccount, 'address' | 'solanaAddress'>,
) => heliumAddressToSolAddress(contact.address) || contact.solanaAddress
