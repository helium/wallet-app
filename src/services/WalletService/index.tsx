import React, { useMemo } from 'react'
import Wallet from '@assets/images/wallet.svg'
import Receive from '@assets/images/receive.svg'
import Send from '@assets/images/send.svg'
import Swap from '@assets/images/swap.svg'
import Transactions from '@assets/images/transactionsTabIcon.svg'
import ServiceSheetPage, {
  ServiceNavBarOption,
} from '@components/ServiceSheetPage'
import { StackNavigationProp } from '@react-navigation/stack'
import WalletPage from './pages/WalletPage'
import SendPage from './pages/SendPage'
import TransactionsPage from './pages/TransactionsPage'
import SwapPage from './pages/SwapPage'
import ReceivePage from './pages/ReceivePage'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
  defaultTokenType?: string
  mint?: string
}

export type WalletServiceStackParamList = {
  Receive: undefined
  Send: undefined | PaymentRouteParam
  Swap: undefined
  Transactions: undefined
  Wallet: undefined
}

export type WalletServiceNavigationProp =
  StackNavigationProp<WalletServiceStackParamList>

const WalletService = () => {
  const options = useMemo((): Array<ServiceNavBarOption> => {
    return [
      { name: 'Wallet', Icon: Wallet, component: WalletPage },
      {
        name: 'Receive',
        Icon: Receive,
        component: ReceivePage,
      },
      {
        name: 'Send',
        Icon: Send,
        component: SendPage,
      },
      {
        name: 'Swap',
        Icon: Swap,
        component: SwapPage,
      },
      {
        name: 'Transactions',
        Icon: Transactions,
        component: TransactionsPage,
      },
    ]
  }, [])

  return <ServiceSheetPage options={options} />
}

export default WalletService
