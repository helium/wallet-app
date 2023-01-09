import React, { useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import CogIco from '@assets/images/cog.svg'
import AccountIco from '@assets/images/account.svg'
import { LayoutChangeEvent } from 'react-native'
import CarotDown from '@assets/images/carot-down.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '../../components/Box'
import NotificationIcon from '../../components/NotificationIcon'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AccountIcon from '../../components/AccountIcon'
import { useAppStorage } from '../../storage/AppStorageProvider'
import useHaptic from '../../hooks/useHaptic'
import IconPressedContainer from '../../components/IconPressedContainer'

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
    triggerImpact()
    navigation.navigate('SettingsNavigator')
  }, [navigation, triggerImpact])

  const handleAddressBook = useCallback(() => {
    triggerImpact()
    navigation.push('AddressBookNavigator')
  }, [navigation, triggerImpact])

  const handleNotificationsSelected = useCallback(() => {
    triggerImpact()
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
      <Box marginStart="m">
        <IconPressedContainer onPress={navToSettings}>
          <CogIco color="white" />
        </IconPressedContainer>
      </Box>

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
      <Box flexDirection="row" marginEnd="l">
        {l1Network === 'helium' && (
          <TouchableOpacityBox
            paddingVertical="ms"
            paddingLeft="s"
            onPress={handleNotificationsSelected}
            marginEnd="m"
          >
            <NotificationIcon />
          </TouchableOpacityBox>
        )}

        <IconPressedContainer onPress={handleAddressBook}>
          <AccountIco color="white" />
        </IconPressedContainer>
      </Box>
    </Box>
  )
}

export default AccountsTopNav
