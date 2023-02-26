import React, { memo, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Box from '@components/Box'
import Text from '@components/Text'
import CloseButton from '@components/CloseButton'
import { CSAccount } from '@storage/cloudStorage'
import { HomeNavigationProp } from '../home/homeTypes'
import ContactsList from './ContactsList'
import { AddressBookNavigationProp } from './addressBookTypes'

const AddressBook = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressNav = useNavigation<AddressBookNavigationProp>()

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

  return (
    <Box flex={1} backgroundColor="surfaceSecondary">
      <Box
        marginTop="s"
        style={{ paddingTop: Platform.OS === 'android' ? 24 : 0 }}
        flexDirection="row"
        alignItems="center"
      >
        <Box flex={1} />
        <Text variant="subtitle2">{t('addressBook.title')}</Text>
        <Box flex={1} alignItems="flex-end">
          <CloseButton
            onPress={onRequestClose}
            paddingVertical="s"
            paddingHorizontal="m"
          />
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
