import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'

export type DerivationType =
  | 'root'
  | 'legacy'
  | 'default'
  | 'extended'
  | 'alternative'
  | 'migration'
  | 'change'

// Derivation path generators
const rootDerivation = () => "44'/501'"
const legacySolanaDerivation = (account = 0) => `44'/501'/${account}'`
const defaultSolanaDerivation = (account = 0) => `44'/501'/${account}'/0'`
const extendedDefaultDerivation = (account = 0) => `44'/501'/${account}'/0'/0'`
const alternativeDerivation = (account = 0) => `44'/501'/${account}'/1'`
const migrationDerivation = (account = 0) => `44'/501'/${account}'/2'`
const changeIndexDerivation = (account = 0) => `44'/501'/${account}'/0'/1'`

export const getDerivationPath = (
  account = 0,
  type: DerivationType,
): string => {
  switch (type) {
    case 'root':
      return rootDerivation()
    case 'legacy':
      return legacySolanaDerivation(account)
    case 'default':
      return defaultSolanaDerivation(account)
    case 'extended':
      return extendedDefaultDerivation(account)
    case 'alternative':
      return alternativeDerivation(account)
    case 'migration':
      return migrationDerivation(account)
    case 'change':
      return changeIndexDerivation(account)
    default:
      return defaultSolanaDerivation(account)
  }
}

export const getAllDerivationPaths = (
  account = 0,
): Array<{ path: string; type: DerivationType }> => {
  if (account === -1) {
    return [{ path: rootDerivation(), type: 'root' }]
  }

  return [
    { path: legacySolanaDerivation(account), type: 'legacy' },
    { path: defaultSolanaDerivation(account), type: 'default' },
    { path: extendedDefaultDerivation(account), type: 'extended' },
    { path: alternativeDerivation(account), type: 'alternative' },
    { path: migrationDerivation(account), type: 'migration' },
    { path: changeIndexDerivation(account), type: 'change' },
  ]
}

export const getDerivationTypeFromPath = (
  derivationPath?: string,
): DerivationType => {
  if (!derivationPath) return 'default'
  const cleanPath = derivationPath.replace(/^m\//, '')

  // Root path: 44'/501'
  if (/^44'\/501'$/.test(cleanPath)) return 'root'

  // Legacy path: 44'/501'/account'
  if (/^44'\/501'\/\d+'$/.test(cleanPath)) return 'legacy'

  // Default path: 44'/501'/account'/0'
  if (/^44'\/501'\/\d+'\/0'$/.test(cleanPath)) return 'default'

  // Extended default path: 44'/501'/account'/0'/0'
  if (/^44'\/501'\/\d+'\/0'\/0'$/.test(cleanPath)) return 'extended'

  // Alternative path: 44'/501'/account'/1'
  if (/^44'\/501'\/\d+'\/1'$/.test(cleanPath)) return 'alternative'

  // Migration path: 44'/501'/account'/2'
  if (/^44'\/501'\/\d+'\/2'$/.test(cleanPath)) return 'migration'

  // Change index path: 44'/501'/account'/0'/1'
  if (/^44'\/501'\/\d+'\/0'\/1'$/.test(cleanPath)) return 'change'

  // Default fallback
  return 'default'
}

export const getDerivationPathLabel = (type: DerivationType): string => {
  switch (type) {
    case 'root':
      return 'Root'
    case 'legacy':
      return 'Legacy'
    case 'default':
      return 'Default'
    case 'extended':
      return 'Extended'
    case 'alternative':
      return 'Alternative'
    case 'migration':
      return 'Migration'
    case 'change':
      return 'Change'
    default:
      return 'Default'
  }
}

const mainNetDerivation = (account = -1) => {
  if (account === -1) {
    return "44'/501'" // main derivation path
  }
  return `44'/501'/${account}'` // sub derivation path
}

export const runDerivationScheme = (account = 0) => {
  return mainNetDerivation(account)
}

export const signLedgerTransaction = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  txBuffer: Buffer,
  derivationType?: DerivationType | boolean,
) => {
  const solana = new AppSolana(transport)
  let derivationPath = getDerivationPath(
    accountIndex,
    (derivationType as DerivationType) || 'default',
  )

  try {
    const { signature } = await solana.signTransaction(derivationPath, txBuffer)
    return signature
  } catch (error) {
    if (error?.toString().includes('0x6a81')) {
      // Fallback to simple derivation
      derivationPath = runDerivationScheme(accountIndex)
      const { signature } = await solana.signTransaction(
        derivationPath,
        txBuffer,
      )
      return signature
    }
    throw error
  }
}

export const signLedgerMessage = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  msgBuffer: Buffer,
  derivationType?: DerivationType | boolean,
) => {
  const solana = new AppSolana(transport)
  let derivationPath = getDerivationPath(
    accountIndex,
    (derivationType as DerivationType) || 'default',
  )

  try {
    const { signature } = await solana.signOffchainMessage(
      derivationPath,
      msgBuffer,
    )
    return signature
  } catch (error) {
    if (error?.toString().includes('0x6a81')) {
      // Fallback to simple derivation
      derivationPath = runDerivationScheme(accountIndex)
      const { signature } = await solana.signOffchainMessage(
        derivationPath,
        msgBuffer,
      )
      return signature
    }
    throw error
  }
}

export const getDerivationTypeForSigning = (
  derivationPath?: string,
): DerivationType => {
  return getDerivationTypeFromPath(derivationPath)
}
