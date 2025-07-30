import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'

const rootDerivation = () => "44'/501'"
const legacySolanaDerivation = (account = 0) => `44'/501'/${account}'`
const defaultSolanaDerivation = (account = 0) => `44'/501'/${account}'/0'`
export const runDerivationScheme = (account = 0, useDefault = false) => {
  if (account === -1) {
    return rootDerivation()
  }
  return useDefault
    ? defaultSolanaDerivation(account)
    : legacySolanaDerivation(account)
}

export const signLedgerTransaction = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  txBuffer: Buffer,
  useDefault = false,
) => {
  const solana = new AppSolana(transport)
  const { signature } = await solana.signTransaction(
    runDerivationScheme(accountIndex, useDefault),
    txBuffer,
  )
  return signature
}

export const signLedgerMessage = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  msgBuffer: Buffer,
  useDefault = false,
) => {
  const solana = new AppSolana(transport)
  const { signature } = await solana.signOffchainMessage(
    runDerivationScheme(accountIndex, useDefault),
    msgBuffer,
  )
  return signature
}

export const shouldUseDefaultDerivation = (
  derivationPath?: string,
): boolean => {
  if (!derivationPath) return false

  // Default/Standard path has 4 levels: m/44'/501'/account'/0'
  // Legacy path has 3 levels: m/44'/501'/account'
  // We can check if it matches the 4-level pattern
  const defaultPattern = /^m\/44'\/501'\/\d+'\/0'$/
  return defaultPattern.test(derivationPath)
}
