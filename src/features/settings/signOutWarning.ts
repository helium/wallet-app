import type { TFunction } from 'i18next'
import { Platform } from 'react-native'

// Sign-out removes the wallet list from iCloud, so every iOS device on the
// same iCloud account loses it too
export const withICloudSignOutWarning = (t: TFunction, message: string) =>
  Platform.OS === 'ios'
    ? message + t('settings.sections.account.signOutAlert.iCloudMessage')
    : message
