import {
  BottomSheetFlatList,
  type BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import type { CSAccount } from '@storage/cloudStorage'
import type { AccountNetTypeOpt } from '@utils/accountUtils'
import React, {
  type ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type { GestureResponderEvent } from 'react-native'
import { AccountListItem } from './AccountListItem'
import { useSheetMargins } from './ContentColumn'
import { Sheet } from './Sheet'

export type AccountSelectorRef = {
  show: (_type?: AccountNetTypeOpt | GestureResponderEvent) => void
  showAccountTypes: (type: AccountNetTypeOpt) => () => void
}

export const isGesture = (
  x?: AccountNetTypeOpt | GestureResponderEvent,
): x is GestureResponderEvent =>
  !!x && typeof x === 'object' && 'bubbles' in (x as GestureResponderEvent)

const SNAP_POINTS = ['60%', '80%']
const LIST_CONTENT_STYLE = { paddingBottom: 32 }

const keyExtractor = (item: CSAccount) => item.address

export type AccountSelectorProps = {
  ref?: React.Ref<AccountSelectorRef>
  children: ReactNode
}

// An account picker sheet. `show` opens it with the accounts of one net
// type; a press on a gesture event shows all accounts. Picking an account
// makes it current and closes the sheet.
export const AccountSelector = ({ ref, children }: AccountSelectorProps) => {
  const sheetRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()
  const [accountsType, setAccountsType] = useState<AccountNetTypeOpt>('all')
  const { sortedAccountsForNetType, currentAccount, setCurrentAccount } =
    useAccountStorage()

  const show = (x?: AccountNetTypeOpt | GestureResponderEvent) => {
    setAccountsType(x !== undefined && !isGesture(x) ? x : 'all')
    sheetRef.current?.present()
  }

  useImperativeHandle(ref, () => ({
    show,
    showAccountTypes: (type: AccountNetTypeOpt) => () => show(type),
  }))

  const handleAccountPress = (account: CSAccount) => {
    setCurrentAccount(account)
    sheetRef.current?.dismiss()
  }

  return (
    <BottomSheetModalProvider>
      <Sheet
        ref={sheetRef}
        style={sheetMargins}
        index={0}
        snapPoints={SNAP_POINTS}
      >
        <BottomSheetFlatList
          contentInsetAdjustmentBehavior="automatic"
          data={sortedAccountsForNetType(accountsType)}
          renderItem={({ item: account }: { item: CSAccount }) => (
            <AccountListItem
              account={account}
              selected={account.address === currentAccount?.address}
              onPress={handleAccountPress}
              disabled={account.address === currentAccount?.address}
            />
          )}
          keyExtractor={keyExtractor}
          contentContainerStyle={LIST_CONTENT_STYLE}
        />
      </Sheet>
      {children}
    </BottomSheetModalProvider>
  )
}
