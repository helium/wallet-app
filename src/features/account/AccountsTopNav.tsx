import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import CogIco from '@assets/images/cog.svg'
import AccountIco from '@assets/images/account.svg'
import { NetTypes as NetType } from '@helium/address'
import Box from '../../components/Box'
import NotificationIcon from '../../components/NotificationIcon'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import { useColors, useVerticalHitSlop } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import * as AccountUtils from '../../utils/accountUtils'

const AccountsTopNav = () => {
  const verticalHitSlop = useVerticalHitSlop('l')
  const { primaryIcon } = useColors()
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount } = useAccountStorage()

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

  return (
    <SafeAreaBox
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingTop="s"
    >
      <TouchableOpacityBox
        hitSlop={verticalHitSlop}
        paddingHorizontal="l"
        onPress={navToSettings}
      >
        <CogIco color={primaryIcon} />
      </TouchableOpacityBox>
      <Box
        paddingHorizontal="l"
        flexDirection="row"
        alignItems="flex-start"
        visible={accountNetType === NetType.TESTNET}
        maxHeight={26}
        overflow="hidden"
      >
        <Text marginLeft="xs" variant="subtitle1" color="red500">
          🚧 {t('generic.testnet')} 🚧
        </Text>
      </Box>
      <Box flexDirection="row" paddingHorizontal="l">
        <TouchableOpacityBox
          hitSlop={verticalHitSlop}
          onPress={handleNotificationsSelected}
          marginRight="s"
        >
          <NotificationIcon />
        </TouchableOpacityBox>
        <TouchableOpacityBox
          onPress={handleAddressBook}
          hitSlop={verticalHitSlop}
        >
          <AccountIco color={primaryIcon} />
        </TouchableOpacityBox>
      </Box>
    </SafeAreaBox>
  )
}

export default AccountsTopNav
