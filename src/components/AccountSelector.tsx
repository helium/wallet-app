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
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { GestureResponderEvent } from 'react-native'
import { useColors, useOpacity, useSpacing } from '@theme/themeHooks'
import useBackHandler from '@hooks/useBackHandler'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { AccountNetTypeOpt } from '../utils/accountUtils'
import AccountListItem from './AccountListItem'
import { CSAccount } from '../storage/cloudStorage'

export type AccountSelectorRef = {
  show: (_type?: AccountNetTypeOpt | GestureResponderEvent) => void
  showAccountTypes: (type: AccountNetTypeOpt) => () => void
}

const isGesture = (
  x?: AccountNetTypeOpt | GestureResponderEvent,
): x is GestureResponderEvent =>
  !!x && typeof x === 'object' && 'bubbles' in (x as GestureResponderEvent)

const AccountSelector = forwardRef(
  ({ children }: { children: ReactNode }, ref: Ref<AccountSelectorRef>) => {
    useImperativeHandle(ref, () => ({ show, showAccountTypes }))

    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { m, xl } = useSpacing()
    const [accountsType, setAccountsTypes] = useState<AccountNetTypeOpt>('all')
    const snapPoints = useMemo(() => ['60%', '80%'], [])
    const colors = useColors()

    const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
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

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: colors.secondaryText,
      }
    }, [colors.secondaryText])

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
      [currentAccount?.address, handleAccountPress],
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
          <BottomSheetFlatList
            data={data}
            renderItem={renderFlatlistItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={flatListContainerStyle}
          />
        </BottomSheetModal>
        {children}
      </BottomSheetModalProvider>
    )
  },
)

export default memo(AccountSelector)
