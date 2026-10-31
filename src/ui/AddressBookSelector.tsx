import React, {
  ReactNode,
  Ref,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { Sheet } from './Sheet'
import { View } from 'react-native'
import ContactsList from '../features/addressBook/ContactsList'
import { HomeNavigationProp } from '../features/home/homeTypes'
import { navigateToHomeScreen } from '../navigation/NavigationHelper'
import type { CSAccount } from '@storage/cloudStorage'

export type AddressBookRef = {
  showAddressBook: (opts: { address?: string; index?: number }) => void
}
type Props = {
  ref?: Ref<AddressBookRef>
  children: ReactNode
  hideCurrentAccount?: boolean
  onContactSelected: (opts: {
    contact: CSAccount
    prevAddress?: string
    index?: number
  }) => void
}

const SNAP_POINTS = ['70%', '90%']

// The contacts sheet sits in a local provider, inside the screen: the app's
// root provider is outside the navigation container and the app providers
// that the contacts list needs.
export const AddressBookSelector = ({
  ref,
  children,
  onContactSelected,
  hideCurrentAccount,
}: Props) => {
  const sheetRef = useRef<BottomSheetModal>(null)
  const homeNav = useNavigation<HomeNavigationProp>()
  const [address, setAddress] = useState<string>()
  const [index, setIndex] = useState<number>()

  useImperativeHandle(ref, () => ({
    showAddressBook: (opts: { address?: string; index?: number }) => {
      setAddress(opts.address)
      setIndex(opts.index)
      sheetRef.current?.present()
    },
  }))

  const handleContactSelected = (contact: CSAccount) => {
    sheetRef.current?.dismiss()
    onContactSelected({ contact, prevAddress: address, index })
  }

  const handleAddNewContact = () => {
    navigateToHomeScreen(homeNav, 'AddNewContact')
  }

  return (
    <View className="flex-1">
      {children}
      <BottomSheetModalProvider>
        <Sheet ref={sheetRef} index={0} snapPoints={SNAP_POINTS}>
          <ContactsList
            showMyAccounts
            hideCurrentAccount={hideCurrentAccount}
            onAddNew={handleAddNewContact}
            handleContactSelected={handleContactSelected}
            address={address}
            insideBottomSheet
          />
        </Sheet>
      </BottomSheetModalProvider>
    </View>
  )
}
