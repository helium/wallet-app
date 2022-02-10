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
import Checkmark from '@assets/images/checkIco.svg'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { GestureResponderEvent } from 'react-native'
import { NetType } from '@helium/crypto-react-native'
import { CSAccount, useAccountStorage } from '../storage/AccountStorageProvider'
import AccountIcon from './AccountIcon'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'
import { useColors, useOpacity, useSpacing } from '../theme/themeHooks'
import Box from './Box'
import { AccountNetTypeOpt } from '../utils/accountUtils'

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
  const { m } = useSpacing()
  const [accountsType, setAccountsTypes] = useState<AccountNetTypeOpt>('all')
  const snapPoints = useMemo(() => ['60%', '80%'], [])
  const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
  const flatListStyle = useMemo(
    () => ({ borderTopColor: primary, borderTopWidth: 1 }),
    [primary],
  )

  const show = useCallback((x?: AccountNetTypeOpt | GestureResponderEvent) => {
    let type: AccountNetTypeOpt = 'all'
    if (x && !isGesture(x)) {
      type = x
    }
    setAccountsTypes(type)
    bottomSheetModalRef.current?.present()
  }, [])

  const showAccountTypes = useCallback(
    (type: AccountNetTypeOpt) => () => show(type),
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
    (account: CSAccount) => () => {
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
      const isSelected = account.address === currentAccount?.address
      return (
        <TouchableOpacityBox
          minHeight={52}
          paddingVertical="m"
          paddingHorizontal="xl"
          flexDirection="row"
          alignItems="center"
          borderBottomWidth={1}
          borderColor="primary"
          onPress={handleAccountPress(account)}
          disabled={account.address === currentAccount?.address}
        >
          <AccountIcon size={40} address={account.address} />
          <Text variant="body1" marginLeft="ms" flex={1}>
            {`${account.alias}${
              account.netType === NetType.TESTNET ? ' (Testnet)' : ''
            }`}
          </Text>
          {isSelected && (
            <Box
              backgroundColor="surfaceContrast"
              height={27}
              width={27}
              borderRadius="round"
              justifyContent="center"
              alignItems="center"
            >
              <Checkmark color={primary} />
            </Box>
          )}
        </TouchableOpacityBox>
      )
    },
    [currentAccount, handleAccountPress, primary],
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
        >
          <BottomSheetFlatList
            data={data}
            renderItem={renderFlatlistItem}
            keyExtractor={keyExtractor}
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
