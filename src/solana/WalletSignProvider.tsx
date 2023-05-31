import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'
import { WalletSignBottomSheetRef } from './walletSignBottomSheetTypes'
import WalletSignBottomSheet from './WalletSignBottomSheet'

const useWalletSignHook = () => {
  const [walletSignBottomSheetRef, setWalletSignBottomSheetRef] =
    useState<WalletSignBottomSheetRef | null>(null)

  const [onClose, setOnClose] = useState<() => void>(() => {})

  return {
    walletSignBottomSheetRef,
    setWalletSignBottomSheetRef,
    onClose,
    setOnClose,
  }
}

const initialState = {
  walletSignBottomSheetRef: null,
  setWalletSignBottomSheetRef: () => {},
  onClose: () => {},
  setOnClose: () => {},
}

const WalletSignContext =
  createContext<ReturnType<typeof useWalletSignHook>>(initialState)
const { Provider } = WalletSignContext

const WalletSignProvider = ({ children }: { children: ReactNode }) => {
  const values = useWalletSignHook()
  const ref = useRef<WalletSignBottomSheetRef | null>(null)

  useEffect(() => {
    if (ref) {
      values.setWalletSignBottomSheetRef(ref.current)
    }
  }, [values, ref])

  return (
    <Provider value={values}>
      <WalletSignBottomSheet ref={ref} onClose={values.onClose}>
        {children}
      </WalletSignBottomSheet>
    </Provider>
  )
}

export const useWalletSign = (): WalletSignManager =>
  useContext(WalletSignContext)

export default WalletSignProvider

export type WalletSignManager = ReturnType<typeof useWalletSignHook>
