import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import Fuse from 'fuse.js'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { NetTypes } from '@helium/address'
import { sortBy, unionBy } from 'lodash'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import FabButton from '@components/FabButton'
import SearchInput from '@components/SearchInput'
import AccountListItem from '@components/AccountListItem'
import { CSAccount } from '../../storage/cloudStorage'

type Props = {
  onAddNew: () => void
  handleContactSelected?: (item: CSAccount) => void
  address?: string
  insideBottomSheet?: boolean
  showMyAccounts?: boolean
  hideCurrentAccount?: boolean
}
const ContactsList = ({
  onAddNew,
  handleContactSelected,
  address,
  insideBottomSheet,
  showMyAccounts = false,
  hideCurrentAccount = false,
}: Props) => {
  const { contactsForNetType, currentAccount, sortedAccountsForNetType } =
    useAccountStorage()

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
          marginHorizontal="7"
          marginTop="8"
          onChangeText={setSearchTerm}
          value={searchTerm}
        />
        <TouchableOpacityBox
          flexDirection="row"
          alignItems="center"
          padding="8"
          onPress={onAddNew}
        >
          <FabButton
            icon="add"
            backgroundColor="secondaryBackground"
            iconColor="base.white"
            size={40}
            disabled
            marginRight="3"
          />
          <Text variant="textMdRegular" color="secondaryText">
            {t('addressBook.addNext')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    )
  }, [onAddNew, searchTerm, t])

  const keyExtractor = useCallback((item: CSAccount) => {
    return item.address
  }, [])

  const allContacts = useMemo(() => {
    const contacts = contactsForNetType()

    if (!showMyAccounts) return contacts

    const accounts = sortedAccountsForNetType(
      currentAccount?.netType || NetTypes.MAINNET,
    ).filter((c) => c.address !== currentAccount?.address)
    return sortBy(
      unionBy(contacts, accounts, ({ address: addr }) => addr),
      ({ alias }) => alias,
    )
  }, [
    contactsForNetType,
    currentAccount,
    showMyAccounts,
    sortedAccountsForNetType,
  ])

  const data = useMemo(() => {
    let listData = allContacts
    if (hideCurrentAccount) {
      listData = listData.filter(
        ({ solanaAddress, address: heliumAddress }) =>
          !(
            heliumAddress === currentAccount?.address ||
            solanaAddress === currentAccount?.solanaAddress
          ),
      )
    }
    if (searchTerm.trim()) {
      listData = new Fuse(allContacts, {
        keys: ['alias', 'address', 'solanaAddress'],
        threshold: 0.3,
        fieldNormWeight: 1,
      })
        .search(searchTerm)
        .map((result) => {
          return result.item
        })
    }
    return listData.sort((a, b) => a.alias.localeCompare(b.alias))
  }, [
    allContacts,
    currentAccount?.address,
    currentAccount?.solanaAddress,
    hideCurrentAccount,
    searchTerm,
  ])

  if (insideBottomSheet) {
    return (
      <BottomSheetFlatList
        ListHeaderComponent={header}
        data={data}
        renderItem={renderFlatlistItem}
        keyExtractor={keyExtractor}
      />
    )
  }

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
