import React, {
  forwardRef,
  memo,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet'
import { GestureResponderEvent } from 'react-native'
import { useSpacing } from '@config/theme/themeHooks'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { CSAccount } from '@config/storage/cloudStorage'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@config/theme/theme'
import { AccountNetTypeOpt } from '../utils/accountUtils'
import AccountListItem from './AccountListItem'
import HeliumBottomSheet from './HeliumBottomSheet'

export type AccountSelectorRef = {
  show: (_type?: AccountNetTypeOpt | GestureResponderEvent) => void
  showAccountTypes: (type: AccountNetTypeOpt) => () => void
}

const isGesture = (
  x?: AccountNetTypeOpt | GestureResponderEvent,
): x is GestureResponderEvent =>
  !!x && typeof x === 'object' && 'bubbles' in (x as GestureResponderEvent)

const AccountSelector = forwardRef((_, ref: Ref<AccountSelectorRef>) => {
  useImperativeHandle(ref, () => ({ show, showAccountTypes }))

  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const spacing = useSpacing()
  const [accountsType, setAccountsTypes] = useState<AccountNetTypeOpt>('all')

  const flatListContainerStyle = useMemo(
    () => ({ padding: spacing['2xl'] }),
    [spacing],
  )

  const show = useCallback((x?: AccountNetTypeOpt | GestureResponderEvent) => {
    let type: AccountNetTypeOpt = 'all'
    if (x !== undefined && !isGesture(x)) {
      type = x
    }
    setAccountsTypes(type)
    bottomSheetModalRef.current?.expand()
  }, [])

  const showAccountTypes = useCallback(
    (type: AccountNetTypeOpt) => () => {
      show(type)
    },
    [show],
  )

  const hide = useCallback(() => {
    bottomSheetModalRef.current?.close()
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
      const isFirst = account.address === data[0].address
      const isLast = account.address === data[data.length - 1].address
      const borderTopStartRadius = isFirst ? '2xl' : 'none'
      const borderTopEndRadius = isFirst ? '2xl' : 'none'
      const borderBottomStartRadius = isLast ? '2xl' : 'none'
      const borderBottomEndRadius = isLast ? '2xl' : 'none'

      return (
        <AccountListItem
          account={account}
          selected={account.address === currentAccount?.address}
          onPress={handleAccountPress}
          disabled={account.address === currentAccount?.address}
          backgroundColor="cardBackground"
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          marginTop={isFirst ? '2xl' : 'none'}
        />
      )
    },
    [currentAccount?.address, handleAccountPress, data],
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
    <ThemeProvider theme={lightTheme}>
      <HeliumBottomSheet
        ref={bottomSheetModalRef}
        index={-1}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetFlatList
          data={data}
          renderItem={renderFlatlistItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={flatListContainerStyle}
        />
      </HeliumBottomSheet>
    </ThemeProvider>
  )
})

export default memo(AccountSelector)
