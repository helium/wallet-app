import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import Fuse from 'fuse.js'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { NetTypes } from '@helium/address'
import { sortBy, unionBy } from 'lodash'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Plus } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import SearchInput from '@components/SearchInput'
import AccountListItem from '@components/AccountListItem'
import { CSAccount } from '../../storage/cloudStorage'

const PlusIcon = withUniwind(Plus)

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
  const handleContactPressed = (item: CSAccount) => {
    handleContactSelected?.(item)
  }

  const renderFlatlistItem = ({
    item: account,
  }: {
    item: CSAccount
    index: number
  }) => {
    return (
      <AccountListItem
        selected={address === account.address}
        account={account}
        onPress={handleContactPressed}
      />
    )
  }

  const header = (
    <View>
      <SearchInput
        placeholder={t('addressBook.searchContacts')}
        marginHorizontal="lx"
        marginTop="xl"
        onChangeText={setSearchTerm}
        value={searchTerm}
      />
      <PressableScale
        feedback="opacity"
        className="flex-row items-center p-8"
        onPress={onAddNew}
      >
        <View className="mr-3 size-10 items-center justify-center rounded-full bg-primary">
          <PlusIcon size={16} colorClassName="accent-primary-foreground" />
        </View>
        <Text size="base" className="text-muted-foreground">
          {t('addressBook.addNext')}
        </Text>
      </PressableScale>
    </View>
  )

  const keyExtractor = (item: CSAccount) => {
    return item.address
  }

  const allContacts = (() => {
    const contacts = contactsForNetType()

    if (!showMyAccounts) return contacts

    const accounts = sortedAccountsForNetType(
      currentAccount?.netType || NetTypes.MAINNET,
    ).filter((c) => c.address !== currentAccount?.address)
    return sortBy(
      unionBy(contacts, accounts, ({ address: addr }) => addr),
      ({ alias }) => alias,
    )
  })()

  const data = (() => {
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
  })()

  if (insideBottomSheet) {
    return (
      <BottomSheetFlatList
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={header}
        data={data}
        renderItem={renderFlatlistItem}
        keyExtractor={keyExtractor}
      />
    )
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={header}
      data={data}
      renderItem={renderFlatlistItem}
      keyExtractor={keyExtractor}
    />
  )
}

export default ContactsList
