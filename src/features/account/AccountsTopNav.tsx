import AccountIco from '@assets/images/account.svg'
import CarotDown from '@assets/images/carot-down.svg'
import CogIco from '@assets/images/cog.svg'
import NotificationsBellIco from '@assets/images/notificationBell.svg'
import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import IconPressedContainer from '@components/IconPressedContainer'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useHaptic from '@hooks/useHaptic'
import useSolanaHealth from '@hooks/useSolanaHealth'
import { useNavigation } from '@react-navigation/native'
import { useColors } from '@theme/themeHooks'
import React, { useCallback, useMemo } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { RootState } from '../../store/rootReducer'

type Props = {
  onPressWallet: () => void
  onLayout?: (event: LayoutChangeEvent) => void
}
const AccountsTopNav = ({ onPressWallet, onLayout }: Props) => {
  const { primaryText } = useColors()
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount, currentNetworkAddress } = useAccountStorage()
  const { cluster } = useSolana()
  const { triggerImpact } = useHaptic()
  const { showBanner } = useSelector((state: RootState) => state.app)
  const { isHealthy } = useSolanaHealth()

  const notificationsByResource = useSelector(
    (appState: RootState) => appState.notifications.notifications,
  )

  const hasUnreadNotifications = useMemo(() => {
    const allNotifs = Object.keys(notificationsByResource).flatMap(
      (k) => notificationsByResource[k],
    )

    const unread = allNotifs.find((n) => !n.viewedAt)
    return !!unread
  }, [notificationsByResource])

  const navToSettings = useCallback(() => {
    triggerImpact('light')
    navigation.navigate('SettingsNavigator')
  }, [navigation, triggerImpact])

  const navToNotifs = useCallback(() => {
    triggerImpact('light')
    navigation.push('NotificationsNavigator')
  }, [navigation, triggerImpact])

  const navToAddressBook = useCallback(() => {
    triggerImpact('light')
    navigation.push('AddressBookNavigator')
  }, [navigation, triggerImpact])

  const { top } = useSafeAreaInsets()

  const bannerVisible = useMemo(() => {
    if (cluster === 'devnet') {
      return true
    }
    return !isHealthy
  }, [cluster, isHealthy])

  const containerStyle = useMemo(
    () => ({ marginTop: bannerVisible && showBanner ? 0 : top }),
    [top, bannerVisible, showBanner],
  )

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      onLayout={onLayout}
      style={containerStyle}
      zIndex={1}
    >
      <Box flexDirection="row">
        <IconPressedContainer onPress={navToSettings}>
          <CogIco color="white" />
        </IconPressedContainer>
        <Box paddingHorizontal="m" />
      </Box>
      <TouchableOpacityBox
        flexDirection="row"
        flex={1}
        flexGrow={1}
        paddingHorizontal="l"
        justifyContent="center"
        alignItems="center"
        paddingVertical="ms"
        onPress={onPressWallet}
      >
        <AccountIcon address={currentNetworkAddress} size={25} />
        <Text
          variant="subtitle1"
          marginLeft="m"
          marginRight="xs"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
        >
          {currentAccount?.alias}
        </Text>
        <CarotDown color={primaryText} />
      </TouchableOpacityBox>
      <Box flexDirection="row">
        <Box position="relative">
          <IconPressedContainer onPress={navToNotifs}>
            <NotificationsBellIco color="white" />
          </IconPressedContainer>
          {hasUnreadNotifications && (
            <Box
              position="absolute"
              justifyContent="center"
              alignItems="center"
              top={14}
              right={12}
              backgroundColor="black"
              borderRadius="round"
              height={10}
              width={10}
            >
              <Box
                backgroundColor="malachite"
                borderRadius="round"
                height={6}
                width={6}
              />
            </Box>
          )}
        </Box>
        <IconPressedContainer onPress={navToAddressBook} padding="none">
          <AccountIco color="white" />
        </IconPressedContainer>
      </Box>
    </Box>
  )
}

export default AccountsTopNav
