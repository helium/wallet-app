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
import { useColors, useOpacity, useSpacing } from '@theme/themeHooks'
import { Theme } from '@theme/theme'
import useBackHandler from '@hooks/useBackHandler'
import ContactsList from '../features/addressBook/ContactsList'
import { HomeNavigationProp } from '../features/home/homeTypes'
import Box from './Box'
import { CSAccount } from '../storage/cloudStorage'

export type AddressBookRef = {
  showAddressBook: (opts: { address?: string; index?: number }) => void
}
type Props = {
  children: ReactNode
  hideCurrentAccount?: boolean
  onContactSelected: (opts: {
    contact: CSAccount
    prevAddress?: string
    index?: number
  }) => void
} & BoxProps<Theme>
const AddressBookSelector = forwardRef(
  (
    { children, onContactSelected, hideCurrentAccount, ...boxProps }: Props,
    ref: Ref<AddressBookRef>,
  ) => {
    useImperativeHandle(ref, () => ({ showAddressBook }))

    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { m } = useSpacing()
    const snapPoints = useMemo(() => ['70%', '90%'], [])
    const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
    const homeNav = useNavigation<HomeNavigationProp>()
    const [address, setAddress] = useState<string>()
    const [index, setIndex] = useState<number>()
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const colors = useColors()

    const showAddressBook = useCallback(
      (opts: { address?: string; index?: number }) => {
        setAddress(opts.address)
        setIndex(opts.index)
        bottomSheetModalRef.current?.present()
        setIsShowing(true)
      },
      [setIsShowing],
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

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: colors.secondaryText,
      }
    }, [colors.secondaryText])

    return (
      <Box flex={1} {...boxProps}>
        {children}
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={snapPoints}
            handleStyle={sheetHandleStyle}
            onDismiss={handleDismiss}
            handleIndicatorStyle={handleIndicatorStyle}
          >
            <ContactsList
              showMyAccounts
              hideCurrentAccount={hideCurrentAccount}
              onAddNew={handleAddNewContact}
              handleContactSelected={handleContactSelected}
              address={address}
              insideBottomSheet
            />
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(AddressBookSelector)
