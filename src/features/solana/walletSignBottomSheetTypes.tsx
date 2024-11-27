import { ReactNode } from 'react'

export enum WalletStandardMessageTypes {
  connect = 'connect',
  signTransaction = 'signTransaction',
  signAndSendTransaction = 'signAndSendTransaction',
  signMessage = 'signMessage',
}

export type WalletSignOpts = {
  url?: string
  type: WalletStandardMessageTypes
  suppressWarnings?: boolean
  header?: string
  message?: string
  warning?: string
  serializedTxs?: Buffer[]
  renderer?: () => ReactNode
}

export type WalletSignBottomSheetRef = {
  show: (opts: WalletSignOpts) => Promise<boolean>
  hide: () => void
}

export type WalletSignBottomSheetProps = {
  onClose: () => void
  children: ReactNode
}
