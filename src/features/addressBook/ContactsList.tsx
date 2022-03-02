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
import SearchInput from '../../components/SearchInput'
import { AccountNetTypeOpt } from '../../utils/accountUtils'
import AccountListItem from '../../components/AccountListItem'

type Props = {
  onAddNew: () => void
  handleContactSelected?: (item: CSAccount) => void
  netTypeOpt?: AccountNetTypeOpt
  address?: string
}
const ContactsList = ({
  onAddNew,
  handleContactSelected,
  netTypeOpt = 'all' as AccountNetTypeOpt,
  address,
}: Props) => {
  const { contacts, contactsForNetType } = useAccountStorage()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const handleContactPressed = useCallback(
    (item: CSAccount) => {
      handleContactSelected?.(item)
    },
    [handleContactSelected],
  )

  const renderFlatlistItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item: account }: { item: CSAccount; index: number }) => {
      return (
        <AccountListItem
          selected={address === account.address}
          account={account}
          onPress={handleContactPressed}
        />
      )
    },
    [address, handleContactPressed],
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
    let listData = contactsForNetType(netTypeOpt)
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
  }, [contacts, contactsForNetType, netTypeOpt, searchTerm])

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
