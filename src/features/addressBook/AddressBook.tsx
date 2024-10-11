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
import BackScreen from '@components/BackScreen'
import ScrollBox from '@components/ScrollBox'

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
    <ScrollBox>
      <BackScreen
        headerTopMargin="6xl"
        edges={[]}
        title={t('addressBook.title')}
        padding="0"
      >
        <Box flex={1} backgroundColor="primaryBackground">
          <ContactsList
            onAddNew={handleAddNewContact}
            handleContactSelected={handleEditContact}
          />
        </Box>
      </BackScreen>
    </ScrollBox>
  )
}

export default memo(AddressBook)
