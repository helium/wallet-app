import React, { useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import CogIco from '@assets/images/cog.svg'
import AccountIco from '@assets/images/account.svg'
import { LayoutChangeEvent } from 'react-native'
import CarotDown from '@assets/images/carot-down.svg'
import { NetTypes } from '@helium/address'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '../../components/Box'
import NotificationIcon from '../../components/NotificationIcon'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import * as AccountUtils from '../../utils/accountUtils'
import AccountIcon from '../../components/AccountIcon'
import BackgroundFill from '../../components/BackgroundFill'
import useLayoutWidth from '../../utils/useLayoutWidth'

type Props = {
  onPressWallet: () => void
  onLayout?: (event: LayoutChangeEvent) => void
}
const AccountsTopNav = ({ onPressWallet, onLayout }: Props) => {
  const { primaryIcon, primaryText } = useColors()
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const [barButtonsRightWidth, setBarButtonsRightWidth] = useLayoutWidth()

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(currentAccount?.address),
    [currentAccount],
  )

  const navToSettings = useCallback(
    () => navigation.navigate('SettingsNavigator'),
    [navigation],
  )

  const handleAddressBook = useCallback(() => {
    navigation.push('AddressBookNavigator')
  }, [navigation])

  const handleNotificationsSelected = useCallback(() => {
    navigation.push('NotificationsNavigator')
  }, [navigation])

  const { top } = useSafeAreaInsets()

  const containerStyle = useMemo(() => ({ marginTop: top }), [top])

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      onLayout={onLayout}
      style={containerStyle}
    >
      {accountNetType === NetTypes.TESTNET && (
        <BackgroundFill backgroundColor="testnet" opacity={1} />
      )}
      <TouchableOpacityBox
        paddingVertical="ms"
        paddingHorizontal="l"
        onPress={navToSettings}
        width={barButtonsRightWidth || 86}
      >
        <CogIco color={primaryIcon} />
      </TouchableOpacityBox>

      <TouchableOpacityBox
        flexDirection="row"
        flex={1}
        paddingHorizontal="l"
        justifyContent="center"
        alignItems="center"
        paddingVertical="ms"
        onPress={onPressWallet}
      >
        <AccountIcon address={currentAccount?.address} size={25} />
        <Text variant="subtitle1" marginLeft="m" marginRight="xs">
          {currentAccount?.alias}
        </Text>
        <CarotDown color={primaryText} />
      </TouchableOpacityBox>
      <Box
        flexDirection="row"
        paddingRight="l"
        onLayout={setBarButtonsRightWidth}
      >
        <TouchableOpacityBox
          paddingVertical="ms"
          paddingLeft="s"
          onPress={handleNotificationsSelected}
          marginRight="s"
        >
          <NotificationIcon />
        </TouchableOpacityBox>
        <TouchableOpacityBox onPress={handleAddressBook} paddingVertical="ms">
          <AccountIco color={primaryIcon} />
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export default AccountsTopNav
