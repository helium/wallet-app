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
  additionalMessage?: string
  manualBalanceChanges?: BalanceChange[]
  manualEstimatedFee?: number
}

export type WalletSignBottomSheetRef = {
  show: ({
    type,
    url,
    additionalMessage,
    manualBalanceChanges,
    manualEstimatedFee,
  }: WalletSignOpts) => Promise<boolean>
  hide: () => void
}

export type WalletSignBottomSheetProps = {
  serializedTx: Buffer | undefined
  onClose: () => void
  children: ReactNode
}
