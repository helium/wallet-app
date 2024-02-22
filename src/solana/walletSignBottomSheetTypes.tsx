import { ReactNode } from 'react'

export enum WalletStandardMessageTypes {
  connect = 'connect',
  signTransaction = 'signTransaction',
  signAndSendTransaction = 'signAndSendTransaction',
  signMessage = 'signMessage',
}

export type BalanceChange = {
  ticker: string
  amount: number
  type: 'send' | 'receive'
}

export type WalletSignOpts = {
  type: WalletStandardMessageTypes
  url: string
  serializedTxs: Buffer[] | undefined
  warning?: string
  additionalMessage?: string
  header?: string
  // Allow supressing warnings for our own txs
  suppressWarnings?: boolean
}

export type WalletSignBottomSheetRef = {
  show: ({
    type,
    url,
    additionalMessage,
    serializedTxs,
    header,
    suppressWarnings,
  }: WalletSignOpts) => Promise<boolean>
  hide: () => void
}

export type WalletSignBottomSheetProps = {
  onClose: () => void
  children: ReactNode
}
