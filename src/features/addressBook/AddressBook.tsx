import React, { memo, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Box from '@components/Box'
import Text from '@components/Text'
import CloseButton from '@components/CloseButton'
import { CSAccount } from '@storage/cloudStorage'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import ContactsList from './ContactsList'
import { AddressBookNavigationProp } from './addressBookTypes'

const AddressBook = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<WalletNavigationProp>()
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
    <Box flex={1} backgroundColor="bg.tertiary">
      <Box
        marginTop="2"
        style={{ paddingTop: Platform.OS === 'android' ? 24 : 0 }}
        flexDirection="row"
        alignItems="center"
      >
        <Box flex={1} />
        <Text variant="textLgMedium" color="primaryText">
          {t('addressBook.title')}
        </Text>
        <Box flex={1} alignItems="flex-end">
          <CloseButton
            onPress={onRequestClose}
            paddingVertical="2"
            paddingHorizontal="4"
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
