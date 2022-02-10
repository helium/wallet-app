import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { NetType } from '@helium/crypto-react-native'
import { useOpacity, useSpacing } from '../theme/themeHooks'
import ContactsList from '../features/addressBook/ContactsList'
import { HomeNavigationProp } from '../features/home/homeTypes'
import { useAccountStorage } from '../storage/AccountStorageProvider'

const initialState = {
  show: (_type?: NetType.NetType) => undefined,
  hide: () => undefined,
}
type AddressBookSelectorActions = {
  show: () => void
  hide: () => void
}
const AddressBookSelectorContext =
  createContext<AddressBookSelectorActions>(initialState)
const { Provider } = AddressBookSelectorContext

const AddressBookSelector = ({ children }: { children: ReactNode }) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const { backgroundStyle } = useOpacity('primaryBackground', 1)
  const { m } = useSpacing()
  const snapPoints = useMemo(() => ['70%', '90%'], [])
  const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
  const homeNav = useNavigation<HomeNavigationProp>()
  const { currentAccount } = useAccountStorage()

  const show = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const hide = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

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
      <Provider value={{ hide, show }}>
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
            handleFinished={hide}
            netTypeOpt={currentAccount?.netType}
          />
        </BottomSheetModal>
        {children}
      </Provider>
    </BottomSheetModalProvider>
  )
}

export const useAddressBookSelector = () =>
  useContext(AddressBookSelectorContext)

export const withAddressBookProvider = (Component: FC) => () =>
  (
    <AddressBookSelector>
      <Component />
    </AddressBookSelector>
  )
