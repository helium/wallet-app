import useSolanaHealth from '@hooks/useSolanaHealth'
import { useNavigation } from '@react-navigation/native'
import { AccountIcon } from '@ui/AccountIcon'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Bell, ChevronDown, CircleUser, Settings } from 'lucide-react-native'
import React from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useNotificationStorage } from '../../storage/NotificationStorageProvider'
import { useAppStore } from '../../store/appStore'
import { HomeNavigationProp } from '../home/homeTypes'

const SettingsIcon = withUniwind(Settings)
const BellIcon = withUniwind(Bell)
const ContactsIcon = withUniwind(CircleUser)
const ChevronDownIcon = withUniwind(ChevronDown)

type Props = {
  onPressWallet: () => void
  onLayout?: (event: LayoutChangeEvent) => void
}
const AccountsTopNav = ({ onPressWallet, onLayout }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount, currentNetworkAddress } = useAccountStorage()
  const { cluster } = useSolana()
  const showBanner = useAppStore((state) => state.showBanner)
  const { isHealthy } = useSolanaHealth()
  const { notificationsByResource } = useNotificationStorage()
  const { top } = useSafeAreaInsets()

  const hasUnreadNotifications = Object.keys(notificationsByResource)
    .flatMap((k) => notificationsByResource[k])
    .some((n) => !n.viewedAt)

  const bannerVisible = cluster === 'devnet' || !isHealthy
  const containerStyle = { marginTop: bannerVisible && showBanner ? 0 : top }

  return (
    <View
      className="z-10 flex-row items-center justify-between"
      onLayout={onLayout}
      style={containerStyle}
    >
      <View className="flex-row">
        <PressableScale
          testID="AccountsTopNav.Settings"
          feedback="opacity"
          className="size-11 items-center justify-center"
          onPress={() => navigation.navigate('SettingsNavigator')}
        >
          <SettingsIcon size={24} colorClassName="accent-muted-foreground" />
        </PressableScale>
        <View className="px-4" />
      </View>
      <PressableScale
        testID="AccountsTopNav.Wallet"
        feedback="opacity"
        className="flex-1 flex-row items-center justify-center px-6 py-3"
        onPress={onPressWallet}
      >
        <AccountIcon address={currentNetworkAddress} size={25} />
        <Text
          size="xl"
          className="ml-4 mr-1 font-medium"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
        >
          {currentAccount?.alias}
        </Text>
        <ChevronDownIcon size={20} colorClassName="accent-foreground" />
      </PressableScale>
      <View className="flex-row items-center">
        <View className="relative">
          <PressableScale
            feedback="opacity"
            className="size-11 items-center justify-center"
            onPress={() => navigation.push('NotificationsNavigator')}
          >
            <BellIcon size={24} colorClassName="accent-muted-foreground" />
          </PressableScale>
          {hasUnreadNotifications && (
            <View className="absolute right-3 top-3.5 size-2.5 items-center justify-center rounded-full bg-background">
              <View className="size-1.5 rounded-full bg-success-500" />
            </View>
          )}
        </View>
        <PressableScale
          feedback="opacity"
          className="size-11 items-center justify-center"
          onPress={() => navigation.push('AddressBookNavigator')}
        >
          <ContactsIcon size={24} colorClassName="accent-muted-foreground" />
        </PressableScale>
      </View>
    </View>
  )
}

export default AccountsTopNav
