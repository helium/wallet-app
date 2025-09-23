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

const DERIVATION_CONFIG = {
  root: () => "44'/501'",
  legacy: (account: number) => `44'/501'/${account}'`,
  default: (account: number) => `44'/501'/${account}'/0'`,
  extended: (account: number) => `44'/501'/${account}'/0'/0'`,
  alternative: (account: number) => `44'/501'/${account}'/1'`,
  migration: (account: number) => `44'/501'/${account}'/2'`,
  change: (account: number) => `44'/501'/${account}'/0'/1'`,
} as const

const DERIVATION_LABELS = {
  root: 'Root',
  legacy: 'Legacy',
  default: 'Default',
  extended: 'Extended',
  alternative: 'Alternative',
  migration: 'Migration',
  change: 'Change',
} as const

const DERIVATION_PATTERNS = {
  root: /^44'\/501'$/,
  legacy: /^44'\/501'\/\d+'$/,
  default: /^44'\/501'\/\d+'\/0'$/,
  extended: /^44'\/501'\/\d+'\/0'\/0'$/,
  alternative: /^44'\/501'\/\d+'\/1'$/,
  migration: /^44'\/501'\/\d+'\/2'$/,
  change: /^44'\/501'\/\d+'\/0'\/1'$/,
} as const

const FALLBACK_ORDER: DerivationType[] = [
  'legacy',
  'alternative',
  'root',
  'default',
  'extended',
  'migration',
  'change',
]

export const getDerivationPath = (
  account = 0,
  type: DerivationType,
): string => {
  // Handle special case: account -1 should always use root derivation
  if (account === -1) {
    return DERIVATION_CONFIG.root()
  }

  const generator = DERIVATION_CONFIG[type]
  return generator(account)
}

export const getAllDerivationPaths = (
  account = 0,
): Array<{ path: string; type: DerivationType }> => {
  if (account === -1) {
    return [{ path: DERIVATION_CONFIG.root(), type: 'root' }]
  }

  return FALLBACK_ORDER.map((type) => ({
    path: getDerivationPath(account, type),
    type,
  }))
}

export const getDerivationTypeFromPath = (
  derivationPath?: string,
): DerivationType => {
  if (!derivationPath) return 'default'
  const cleanPath = derivationPath.replace(/^m\//, '')

  return (
    (Object.entries(DERIVATION_PATTERNS).find(([, pattern]) =>
      pattern.test(cleanPath),
    )?.[0] as DerivationType) || 'default'
  )
}

export const getDerivationPathLabel = (type: DerivationType): string => {
  return DERIVATION_LABELS[type] || 'Default'
}

const trySignWithFallbacks = async (
  solana: AppSolana,
  accountIndex: number,
  buffer: Buffer,
  signMethod: 'signTransaction' | 'signOffchainMessage',
  primaryType?: DerivationType,
): Promise<Buffer> => {
  const primaryPath = getDerivationPath(accountIndex, primaryType || 'default')
  try {
    const { signature } = await solana[signMethod](primaryPath, buffer)
    return signature
  } catch (error) {
    // If the primary path fails with 0x6a81, try the fallbacks
    if (error?.toString().includes('0x6a81')) {
      const fallbackPathsAttempted: DerivationType[] = []

      for (let i = 0; i < FALLBACK_ORDER.length; i += 1) {
        const type: DerivationType = FALLBACK_ORDER[i]
        try {
          const fallbackPath = getDerivationPath(accountIndex, type)
          fallbackPathsAttempted.push(type)
          const { signature } = await solana[signMethod](fallbackPath, buffer)
          return signature
        } catch (fallbackError) {
          // If the fallback fails with 0x6985, it's user rejection
          if (fallbackError?.toString().includes('0x6985')) {
            throw new Error('Transaction rejected by user')
          }
        }
      }
    }

    throw error
  }
}

export const signLedgerTransaction = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  txBuffer: Buffer,
  derivationType?: DerivationType | boolean,
) => {
  const solana = new AppSolana(transport)

  const primaryType =
    derivationType === true ? undefined : (derivationType as DerivationType)

  return trySignWithFallbacks(
    solana,
    accountIndex,
    txBuffer,
    'signTransaction',
    primaryType,
  )
}

export const signLedgerMessage = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  msgBuffer: Buffer,
  derivationType?: DerivationType | boolean,
) => {
  const solana = new AppSolana(transport)

  const primaryType =
    derivationType === true ? undefined : (derivationType as DerivationType)

  return trySignWithFallbacks(
    solana,
    accountIndex,
    msgBuffer,
    'signOffchainMessage',
    primaryType,
  )
}

export const getDerivationTypeForSigning = (
  derivationPath?: string,
): DerivationType => {
  return getDerivationTypeFromPath(derivationPath)
}
