import { ReactNode } from 'react'

export enum WalletStandardMessageTypes {
  connect = 'connect',
  signTransaction = 'signTransaction',
  signAndSendTransaction = 'signAndSendTransaction',
  signMessage = 'signMessage',
}

export type WalletSignOptsCommon = {
  onCancelHandler: () => void
  onAcceptHandler: () => void
}

export type WalletSignOptsCompact = {
  header: string
  message: string
  onSimulate: () => Promise<void>
}

export type WalletSignOptsSimulated = {
  type: WalletStandardMessageTypes
  url: string
  serializedTxs: Buffer[] | undefined
  warning?: string
  additionalMessage?: string
  header?: string
  // Allow supressing warnings for our own txs
  suppressWarnings?: boolean
}

export type WalletSignOpts = WalletSignOptsCompact | WalletSignOptsSimulated

export type WalletSignBottomSheetRef = {
  show: (opts: WalletSignOpts) => Promise<boolean>
  hide: () => void
}

export type WalletSignBottomSheetProps = {
  onClose: () => void
  children: ReactNode
}
