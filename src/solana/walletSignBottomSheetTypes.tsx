import { ReactNode } from 'react'

export enum WalletStandardMessageTypes {
  connect = 'connect',
  signTransaction = 'signTransaction',
  signAndSendTransaction = 'signAndSendTransaction',
  signMessage = 'signMessage',
}

export type WalletSignOpts = {
  type: WalletStandardMessageTypes
  url: string
  additionalMessage?: string
}

export type WalletSignBottomSheetRef = {
  show: ({ type, url, additionalMessage }: WalletSignOpts) => Promise<boolean>
  hide: () => void
}

export type WalletSignBottomSheetProps = {
  serializedTx: Buffer | undefined
  onClose: () => void
  children: ReactNode
}
