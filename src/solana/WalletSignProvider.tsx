import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'
import WalletSignBottomSheet, {
  WalletSignBottomSheetRef,
} from './WalletSignBottomSheet'

const useWalletSignHook = () => {
  const [walletSignBottomSheetRef, setWalletSignBottomSheetRef] =
    useState<WalletSignBottomSheetRef | null>(null)
  const [serializedTx, setSerializedTx] = useState<Buffer | undefined>(
    undefined,
  )
  const [onClose, setOnClose] = useState<() => void>(() => {})

  return {
    walletSignBottomSheetRef,
    setWalletSignBottomSheetRef,
    serializedTx,
    setSerializedTx,
    onClose,
    setOnClose,
  }
}

const initialState = {
  walletSignBottomSheetRef: null,
  setWalletSignBottomSheetRef: () => {},
  serializedTx: undefined,
  setSerializedTx: () => {},
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
      <WalletSignBottomSheet
        serializedTx={values.serializedTx}
        ref={ref}
        onClose={values.onClose}
      >
        {children}
      </WalletSignBottomSheet>
    </Provider>
  )
}

export const useWalletSign = (): WalletSignManager =>
  useContext(WalletSignContext)

export default WalletSignProvider

export type WalletSignManager = ReturnType<typeof useWalletSignHook>
