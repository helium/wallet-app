import React, { memo, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import { CSAccount } from '@config/storage/cloudStorage'
import BackScreen from '@components/BackScreen'
import ScrollBox from '@components/ScrollBox'
import ContactsList from './ContactsList'
import { AddressBookNavigationProp } from './addressBookTypes'

const AddressBook = () => {
  const { t } = useTranslation()
  const addressNav = useNavigation<AddressBookNavigationProp>()

  const handleAddNewContact = useCallback(() => {
    addressNav.push('AddNewContact')
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
