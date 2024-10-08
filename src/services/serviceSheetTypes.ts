import { StackNavigationProp } from '@react-navigation/stack'

export type ServiceSheetStackParamList = {
  WalletService: undefined
  HotspotService: undefined
  AccountsService: undefined
  GovernanceService: undefined
  BrowserService: undefined
  SettingsService: undefined
  NotificationsService: undefined
}

export type ServiceSheetNavigationProp =
  StackNavigationProp<ServiceSheetStackParamList>
