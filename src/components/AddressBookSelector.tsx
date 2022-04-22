/* eslint-disable react/jsx-props-no-spreading */
import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { BoxProps } from '@shopify/restyle'
import { useOpacity, useSpacing } from '../theme/themeHooks'
import ContactsList from '../features/addressBook/ContactsList'
import { HomeNavigationProp } from '../features/home/homeTypes'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { Theme } from '../theme/theme'
import Box from './Box'
import { CSAccount } from '../storage/cloudStorage'

export type AddressBookRef = {
  showAddressBook: (opts: { address?: string; index?: number }) => void
}
type Props = {
  children: ReactNode
  onContactSelected: (opts: {
    contact: CSAccount
    prevAddress?: string
    index?: number
  }) => void
} & BoxProps<Theme>
const AddressBookSelector = forwardRef(
  (
    { children, onContactSelected, ...boxProps }: Props,
    ref: Ref<AddressBookRef>,
  ) => {
    useImperativeHandle(ref, () => ({ showAddressBook }))

    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('primaryBackground', 1)
    const { m } = useSpacing()
    const snapPoints = useMemo(() => ['70%', '90%'], [])
    const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
    const homeNav = useNavigation<HomeNavigationProp>()
    const { currentAccount } = useAccountStorage()
    const [address, setAddress] = useState<string>()
    const [index, setIndex] = useState<number>()

    const showAddressBook = useCallback(
      (opts: { address?: string; index?: number }) => {
        setAddress(opts.address)
        setIndex(opts.index)
        bottomSheetModalRef.current?.present()
      },
      [],
    )

    const handleContactSelected = useCallback(
      (contact: CSAccount) => {
        bottomSheetModalRef.current?.dismiss()
        onContactSelected({ contact, prevAddress: address, index })
      },
      [address, index, onContactSelected],
    )

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const handleAddNewContact = useCallback(() => {
      homeNav.navigate('AddNewContact')
    }, [homeNav])

    return (
      <BottomSheetModalProvider>
        <Box flex={1} {...boxProps}>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={snapPoints}
            handleStyle={sheetHandleStyle}
          >
            <ContactsList
              onAddNew={handleAddNewContact}
              handleContactSelected={handleContactSelected}
              netTypeOpt={currentAccount?.netType}
              address={address}
              insideBottomSheet
            />
          </BottomSheetModal>
          {children}
        </Box>
      </BottomSheetModalProvider>
    )
  },
)

export default memo(AddressBookSelector)
