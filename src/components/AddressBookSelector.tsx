/* eslint-disable react/jsx-props-no-spreading */
import React, {
  forwardRef,
  memo,
  Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { BoxProps, ThemeProvider } from '@shopify/restyle'
import { lightTheme, Theme } from '@theme/theme'
import ContactsList from '@features/addressBook/ContactsList'
import { CSAccount } from '@storage/cloudStorage'
import { Portal } from '@gorhom/portal'
import { useTranslation } from 'react-i18next'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import HeliumBottomSheet from './HeliumBottomSheet'
import { SafeAreaBox, Text } from '.'

export type AddressBookRef = {
  showAddressBook: (opts: { address?: string; index?: number }) => void
}
type Props = {
  hideCurrentAccount?: boolean
  onContactSelected: (opts: {
    contact: CSAccount
    prevAddress?: string
    index?: number
  }) => void
} & BoxProps<Theme>
const AddressBookSelector = forwardRef(
  (
    { onContactSelected, hideCurrentAccount, ...boxProps }: Props,
    ref: Ref<AddressBookRef>,
  ) => {
    useImperativeHandle(ref, () => ({ showAddressBook }))

    const bottomSheetModalRef = useRef<BottomSheet>(null)
    const { t } = useTranslation()
    const homeNav = useNavigation<WalletNavigationProp>()
    const [address, setAddress] = useState<string>()
    const [index, setIndex] = useState<number>()

    const showAddressBook = useCallback(
      (opts: { address?: string; index?: number }) => {
        setAddress(opts.address)
        setIndex(opts.index)
        bottomSheetModalRef.current?.expand()
      },
      [],
    )

    const handleContactSelected = useCallback(
      (contact: CSAccount) => {
        bottomSheetModalRef.current?.close()
        onContactSelected({ contact, prevAddress: address, index })
      },
      [address, index, onContactSelected],
    )

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          opacity={1}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        >
          <SafeAreaBox backgroundColor="primaryText" flex={1}>
            <Text
              marginTop="xl"
              variant="displaySmSemibold"
              color="primaryBackground"
              textAlign="center"
            >
              {t('addressBookSelector.title')}
            </Text>
          </SafeAreaBox>
        </BottomSheetBackdrop>
      ),
      [],
    )

    const handleAddNewContact = useCallback(() => {
      homeNav.navigate('AddNewContact')
    }, [homeNav])

    return (
      <Portal>
        <ThemeProvider theme={lightTheme}>
          <BottomSheetModalProvider>
            <HeliumBottomSheet
              ref={bottomSheetModalRef}
              index={-1}
              backdropComponent={renderBackdrop}
            >
              <ContactsList
                showMyAccounts
                hideCurrentAccount={hideCurrentAccount}
                onAddNew={handleAddNewContact}
                handleContactSelected={handleContactSelected}
                address={address}
                insideBottomSheet
              />
            </HeliumBottomSheet>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </Portal>
    )
  },
)

export default memo(AddressBookSelector)
