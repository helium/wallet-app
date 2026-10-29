import type { TFunction } from 'i18next'
import { Platform } from 'react-native'

type SignOutScope = 'allWallets' | 'oneWallet'

const ICLOUD_MESSAGE_KEYS: Record<SignOutScope, string> = {
  allWallets: 'settings.sections.account.signOutAlert.iCloudMessage',
  oneWallet: 'settings.sections.account.signOutAlert.iCloudMessageOneWallet',
}

// iCloud holds the wallet list shared by every iOS device on the same iCloud
// account: removing every wallet empties it there, removing one wallet drops
// only that wallet there
export const withICloudSignOutWarning = (
  t: TFunction,
  message: string,
  scope: SignOutScope,
) => (Platform.OS === 'ios' ? message + t(ICLOUD_MESSAGE_KEYS[scope]) : message)
