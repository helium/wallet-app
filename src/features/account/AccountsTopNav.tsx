import React, { useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import CogIco from '@assets/images/cog.svg'
import AccountIco from '@assets/images/account.svg'
import { LayoutChangeEvent } from 'react-native'
import CarotDown from '@assets/images/carot-down.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NotificationBell from '@assets/images/notificationBell.svg'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import AccountIcon from '@components/AccountIcon'
import useHaptic from '@hooks/useHaptic'
import IconPressedContainer from '@components/IconPressedContainer'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'

type Props = {
  onPressWallet: () => void
  onLayout?: (event: LayoutChangeEvent) => void
}
const AccountsTopNav = ({ onPressWallet, onLayout }: Props) => {
  const { primaryText } = useColors()
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount, currentNetworkAddress } = useAccountStorage()
  const { l1Network } = useAppStorage()
  const { triggerImpact } = useHaptic()

  const navToSettings = useCallback(() => {
    triggerImpact('light')
    navigation.navigate('SettingsNavigator')
  }, [navigation, triggerImpact])

  const handleAddressBook = useCallback(() => {
    triggerImpact('light')
    navigation.push('AddressBookNavigator')
  }, [navigation, triggerImpact])

  const handleNotificationsSelected = useCallback(() => {
    triggerImpact('light')
    navigation.push('NotificationsNavigator')
  }, [navigation, triggerImpact])

  const { top } = useSafeAreaInsets()

  const containerStyle = useMemo(() => ({ marginTop: top }), [top])

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      onLayout={onLayout}
      style={containerStyle}
      zIndex={1}
    >
      <Box marginStart="s">
        <IconPressedContainer onPress={navToSettings}>
          <CogIco color="white" />
        </IconPressedContainer>
      </Box>
      {l1Network === 'helium' && <IconPressedContainer />}
      <TouchableOpacityBox
        flexDirection="row"
        flex={1}
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
      <Box flexDirection="row" marginEnd="s">
        {l1Network === 'helium' && (
          <IconPressedContainer onPress={handleNotificationsSelected}>
            <NotificationBell color="white" />
          </IconPressedContainer>
        )}

        <IconPressedContainer onPress={handleAddressBook}>
          <AccountIco color="white" />
        </IconPressedContainer>
      </Box>
    </Box>
  )
}

export default AccountsTopNav
