import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { X } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import { CSAccount } from '@storage/cloudStorage'
import { HomeNavigationProp } from '../home/homeTypes'
import ContactsList from './ContactsList'
import { AddressBookNavigationProp } from './addressBookTypes'

const CloseIcon = withUniwind(X)

const AddressBook = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressNav = useNavigation<AddressBookNavigationProp>()

  const onRequestClose = () => {
    homeNav.goBack()
  }

  const handleAddNewContact = () => {
    addressNav.navigate('AddNewContact')
  }

  const handleEditContact = (contact: CSAccount) => {
    addressNav.navigate('EditContact', { contact })
  }

  return (
    <View className="flex-1 bg-secondary">
      <View className="mt-2 flex-row items-center android:pt-6">
        <View className="flex-1" />
        <Text size="lg" className="font-medium">
          {t('addressBook.title')}
        </Text>
        <View className="flex-1 items-end">
          <PressableScale
            onPress={onRequestClose}
            feedback="opacity"
            className="px-4 py-2"
          >
            <CloseIcon size={18} colorClassName="accent-foreground" />
          </PressableScale>
        </View>
      </View>
      <ContactsList
        onAddNew={handleAddNewContact}
        handleContactSelected={handleEditContact}
      />
    </View>
  )
}

export default AddressBook
