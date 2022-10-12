import React, {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { GestureResponderEvent } from 'react-native'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useColors, useOpacity, useSpacing } from '../theme/themeHooks'
import { AccountNetTypeOpt } from '../utils/accountUtils'
import AccountListItem from './AccountListItem'
import { CSAccount } from '../storage/cloudStorage'
import useBackHandler from '../utils/useBackHandler'

const initialState = {
  show: (_type?: AccountNetTypeOpt) => undefined,
  showAccountTypes: (_type: AccountNetTypeOpt) => () => undefined,
  hide: () => undefined,
}
type AccountSelectorActions = {
  show: () => void
  hide: () => void
  showAccountTypes: (type: AccountNetTypeOpt) => () => void
}
const AccountSelectorContext =
  createContext<AccountSelectorActions>(initialState)
const { Provider } = AccountSelectorContext

const isGesture = (
  x?: AccountNetTypeOpt | GestureResponderEvent,
): x is GestureResponderEvent =>
  !!x && typeof x === 'object' && 'bubbles' in (x as GestureResponderEvent)

const AccountSelector = ({ children }: { children: ReactNode }) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const { primary } = useColors()
  const { backgroundStyle } = useOpacity('primaryBackground', 1)
  const { m, xl } = useSpacing()
  const [accountsType, setAccountsTypes] = useState<AccountNetTypeOpt>('all')
  const snapPoints = useMemo(() => ['60%', '80%'], [])

  const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])

  const flatListStyle = useMemo(
    () => ({ borderTopColor: primary, borderTopWidth: 1 }),
    [primary],
  )
  const flatListContainerStyle = useMemo(() => ({ paddingBottom: xl }), [xl])

  const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)

  const show = useCallback(
    (x?: AccountNetTypeOpt | GestureResponderEvent) => {
      let type: AccountNetTypeOpt = 'all'
      if (x !== undefined && !isGesture(x)) {
        type = x
      }
      setAccountsTypes(type)
      bottomSheetModalRef.current?.present()
      setIsShowing(true)
    },
    [setIsShowing],
  )

  const showAccountTypes = useCallback(
    (type: AccountNetTypeOpt) => () => {
      show(type)
    },
    [show],
  )

  const hide = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const { sortedAccountsForNetType, currentAccount, setCurrentAccount } =
    useAccountStorage()

  const data = useMemo(
    () => sortedAccountsForNetType(accountsType),

    [accountsType, sortedAccountsForNetType],
  )

  const handleAccountPress = useCallback(
    (account: CSAccount) => {
      setCurrentAccount(account)
      hide()
    },
    [hide, setCurrentAccount],
  )

  const keyExtractor = useCallback((item: CSAccount) => {
    return item.address
  }, [])

  const renderFlatlistItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item: account }: { item: CSAccount; index: number }) => {
      return (
        <AccountListItem
          account={account}
          selected={account.address === currentAccount?.address}
          onPress={handleAccountPress}
          disabled={account.address === currentAccount?.address}
        />
      )
    },
    [currentAccount, handleAccountPress],
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
  return (
    <BottomSheetModalProvider>
      <Provider value={{ hide, show, showAccountTypes }}>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={renderBackdrop}
          snapPoints={snapPoints}
          handleStyle={sheetHandleStyle}
          onDismiss={handleDismiss}
        >
          <BottomSheetFlatList
            data={data}
            renderItem={renderFlatlistItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={flatListContainerStyle}
            style={flatListStyle}
          />
        </BottomSheetModal>
        {children}
      </Provider>
    </BottomSheetModalProvider>
  )
}

export default memo(AccountSelector)

export const useAccountSelector = () => useContext(AccountSelectorContext)
