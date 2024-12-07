import React, { useMemo } from 'react'
import Wallet from '@assets/svgs/wallet.svg'
import AddExistingWallet from '@assets/svgs/addExistingWallet.svg'
import Add from '@assets/svgs/add.svg'
import Keystone from '@assets/svgs/keystone.svg'
import KeystoneSelected from '@assets/svgs/keystoneSelected.svg'
import Ledger from '@assets/svgs/ledger.svg'
import LedgerSelected from '@assets/svgs/ledgerSelected.svg'
import ServiceSheetPage, {
  ServiceNavBarOption,
} from '@components/ServiceSheetPage'
import { StackNavigationProp } from '@react-navigation/stack'
import YourWalletsPage from './pages/YourWalletsPage'
import CreateSeedPhrasePage from './pages/CreateSeedPhrasePage'
import AddExistingWalletPage from './pages/AddExistingWalletPage'
import PairLedgerPage from './pages/PairLedgerPage'
import ConnectKeystonePage from './pages/ConnectKeystonePage'

export type YourWalletsServiceStackParamList = {
  YourWalletsPage: undefined
  CreateSeedPhrasePage: undefined
  AddExistingWalletPage: undefined
  PairLedgerPage: undefined
  ConnectKeystonePage: undefined
}

export type YourWalletsServiceNavigationProp =
  StackNavigationProp<YourWalletsServiceStackParamList>

const YourWalletsService = () => {
  const options = useMemo((): Array<ServiceNavBarOption> => {
    return [
      { name: 'YourWalletsPage', Icon: Wallet, component: YourWalletsPage },
      {
        name: 'CreateSeedPhrasePage',
        Icon: Add,
        component: CreateSeedPhrasePage,
      },
      {
        name: 'AddExistingWalletPage',
        Icon: AddExistingWallet,
        component: AddExistingWalletPage,
      },
      {
        name: 'PairLedgerPage',
        Icon: Ledger,
        IconActive: LedgerSelected,
        component: PairLedgerPage,
      },
      {
        name: 'ConnectKeystonePage',
        Icon: Keystone,
        IconActive: KeystoneSelected,
        component: ConnectKeystonePage,
      },
    ]
  }, [])

  return <ServiceSheetPage options={options} />
}

export default YourWalletsService
