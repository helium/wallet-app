import React, { memo, useCallback } from 'react'
import Close from '@assets/images/close.svg'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'
import ContactsList from './ContactsList'
import { AddressBookNavigationProp } from './addressBookTypes'

const AddressBook = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressNav = useNavigation<AddressBookNavigationProp>()
  const { primaryText } = useColors()

  const onRequestClose = useCallback(() => {
    homeNav.navigate('AccountsScreen')
  }, [homeNav])

  const handleAddNewContact = useCallback(() => {
    addressNav.navigate('AddNewContact')
  }, [addressNav])

  return (
    <SafeAreaBox flex={1}>
      <Box flexDirection="row" alignItems="center">
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
      <ContactsList onAddNew={handleAddNewContact} />
    </SafeAreaBox>
  )
}

export default memo(AddressBook)
