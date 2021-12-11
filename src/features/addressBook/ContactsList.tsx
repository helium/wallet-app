import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import Fuse from 'fuse.js'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import {
  CSAccount,
  useAccountStorage,
} from '../../storage/AccountStorageProvider'
import FabButton from '../../components/FabButton'
import AccountIcon from '../../components/AccountIcon'
import SearchInput from '../../components/SearchInput'

type Props = { onAddNew: () => void }
const ContactsList = ({ onAddNew }: Props) => {
  const { contacts } = useAccountStorage()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const renderFlatlistItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: CSAccount; index: number }) => {
      return (
        <TouchableOpacityBox
          minHeight={52}
          paddingVertical="ms"
          paddingHorizontal="xl"
          flexDirection="row"
          alignItems="center"
        >
          <AccountIcon size={40} address={item.address} />
          <Text variant="body1" marginLeft="ms">
            {item.alias}
          </Text>
        </TouchableOpacityBox>
      )
    },
    [],
  )

  const header = useMemo(() => {
    return (
      <Box>
        <SearchInput
          placeholder={t('addressBook.searchContacts')}
          marginHorizontal="lx"
          marginTop="xl"
          onChangeText={setSearchTerm}
          value={searchTerm}
        />
        <TouchableOpacityBox
          flexDirection="row"
          alignItems="center"
          padding="xl"
          onPress={onAddNew}
        >
          <FabButton
            icon="add"
            backgroundColor="grey900"
            iconColor="white"
            size={40}
            disabled
            marginRight="ms"
          />
          <Text variant="body1" color="secondaryText">
            {t('addressBook.addNext')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    )
  }, [onAddNew, searchTerm, t])

  const keyExtractor = useCallback((item: CSAccount) => {
    return item.address
  }, [])

  const data = useMemo(() => {
    let listData = contacts
    if (searchTerm.trim()) {
      listData = new Fuse(contacts, {
        keys: ['alias'],
        threshold: 0.3,
      })
        .search(searchTerm)
        .map((result) => {
          return result.item
        })
    }
    return listData.sort((a, b) => a.alias.localeCompare(b.alias))
  }, [contacts, searchTerm])

  return (
    <FlatList
      ListHeaderComponent={header}
      data={data}
      renderItem={renderFlatlistItem}
      keyExtractor={keyExtractor}
    />
  )
}

export default memo(ContactsList)
