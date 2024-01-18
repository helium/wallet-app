import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'

const mainNetDerivation = (account = -1) => {
  if (account === -1) {
    return "44'/501'" // main derivation path
  }
  return `44'/501'/${account}'` // sub derivation path
}

// Replaces the account alias with the index from the ledger
export const runDerivationScheme = (account = 0) => {
  return mainNetDerivation(account)
}

export const signLedgerTransaction = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  txBuffer: Buffer,
) => {
  const solana = new AppSolana(transport)
  const { signature } = await solana.signTransaction(
    runDerivationScheme(accountIndex),
    txBuffer,
  )
  return signature
}

export const signLedgerMessage = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  msgBuffer: Buffer,
) => {
  const solana = new AppSolana(transport)
  const { signature } = await solana.signOffchainMessage(
    runDerivationScheme(accountIndex),
    msgBuffer,
  )
  return signature
}
