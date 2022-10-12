import React, { memo, useCallback } from 'react'
import Close from '@assets/images/close.svg'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'
import ContactsList from './ContactsList'
import { AddressBookNavigationProp } from './addressBookTypes'
import { CSAccount } from '../../storage/cloudStorage'
import useNetworkColor from '../../utils/useNetworkColor'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

const AddressBook = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressNav = useNavigation<AddressBookNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const { primaryText } = useColors()

  const onRequestClose = useCallback(() => {
    homeNav.goBack()
  }, [homeNav])

  const handleAddNewContact = useCallback(() => {
    addressNav.navigate('AddNewContact')
  }, [addressNav])

  const handleEditContact = useCallback(
    (contact: CSAccount) => {
      addressNav.navigate('EditContact', { contact })
    },
    [addressNav],
  )

  const backgroundColor = useNetworkColor({ netType: currentAccount?.netType })

  return (
    <Box flex={1}>
      <Box
        style={{ paddingTop: Platform.OS === 'android' ? 24 : 0 }}
        flexDirection="row"
        alignItems="center"
        backgroundColor={backgroundColor}
      >
        <Box flex={1} />
        <Text variant="subtitle2">{t('addressBook.title')}</Text>
        <Box flex={1} alignItems="flex-end">
          <TouchableOpacityBox
            onPress={onRequestClose}
            paddingVertical="m"
            paddingHorizontal="xl"
          >
            <Close color={primaryText} height={16} width={16} />
          </TouchableOpacityBox>
        </Box>
      </Box>
      <ContactsList
        onAddNew={handleAddNewContact}
        handleContactSelected={handleEditContact}
      />
    </Box>
  )
}

export default memo(AddressBook)
